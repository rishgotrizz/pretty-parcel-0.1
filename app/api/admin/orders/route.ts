import { z } from "zod";

import { Order } from "@/lib/models/Order";
import { isObjectId, logApiError, parseJsonBody } from "@/lib/server/api";
import { requireAdmin } from "@/lib/server/auth";
import { connectToDatabase } from "@/lib/server/db";
import { formatOrderStatus, normalizeOrderStatus } from "@/lib/utils";

const orderStatusSchema = z.object({
  orderId: z.string(),
  status: z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled"])
});

const allowedTransitions: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  paid: ["confirmed", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  out_for_delivery: ["delivered"],
  delivered: [],
  cancelled: []
};

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof Response) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectToDatabase();
  const orders = await Order.find().sort({ createdAt: -1 }).limit(20).lean();
  return Response.json({
    orders: (orders as any[]).map((order) => ({
      _id: order._id.toString(),
      status: normalizeOrderStatus(order.status),
      total: order.total,
      createdAt: new Date(order.createdAt).toISOString(),
      customerName: order.shippingAddress?.fullName ?? "Customer",
      customerEmail: order.shippingAddress?.email ?? "",
      paymentStatus: order.payment?.status ?? "pending",
      itemCount: order.items?.length ?? 0,
      items:
        order.items?.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          slug: item.slug
        })) ?? [],
      shippingAddress: order.shippingAddress
        ? {
            fullName: order.shippingAddress.fullName ?? "",
            email: order.shippingAddress.email ?? "",
            phone: order.shippingAddress.phone ?? "",
            line1: order.shippingAddress.line1 ?? "",
            line2: order.shippingAddress.line2 ?? "",
            city: order.shippingAddress.city ?? "",
            state: order.shippingAddress.state ?? "",
            postalCode: order.shippingAddress.postalCode ?? "",
            country: order.shippingAddress.country ?? "India"
          }
        : null,
      customizationDetails: order.customizationDetails
        ? {
          giftMessage: order.customizationDetails.giftMessage ?? "",
          nameCustomization: order.customizationDetails.nameCustomization ?? "",
          specialInstructions: order.customizationDetails.specialInstructions ?? ""
          }
        : null
    }))
  });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof Response) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const parsed = orderStatusSchema.safeParse(await parseJsonBody(request));
    if (!parsed.success) {
      return Response.json({ error: "Invalid order update." }, { status: 400 });
    }
    if (!isObjectId(parsed.data.orderId)) {
      return Response.json({ error: "Invalid order id." }, { status: 400 });
    }

    await connectToDatabase();
    const order = await Order.findById(parsed.data.orderId);
    if (!order) {
      return Response.json({ error: "Order not found." }, { status: 404 });
    }

    const currentStatus = normalizeOrderStatus(order.status);
    if (!allowedTransitions[currentStatus]?.includes(parsed.data.status)) {
      return Response.json(
        { error: `Order cannot move from ${formatOrderStatus(currentStatus)} to ${formatOrderStatus(parsed.data.status)}.` },
        { status: 400 }
      );
    }

    if (["confirmed", "shipped", "delivered"].includes(parsed.data.status) && order.payment?.status !== "paid") {
      return Response.json({ error: "Only paid orders can move into fulfilment stages." }, { status: 400 });
    }

    order.status = parsed.data.status;
    order.tracking = {
      ...order.tracking,
      timeline: [
        ...(order.tracking?.timeline ?? []),
        {
          status: parsed.data.status,
          label: `Order marked as ${formatOrderStatus(parsed.data.status)} by admin.`,
          at: new Date()
        }
      ]
    };
    await order.save();

    return Response.json({ success: true });
  } catch (error) {
    logApiError("api/admin/orders:PATCH", error);
    return Response.json({ error: "Could not update order right now." }, { status: 500 });
  }
}
