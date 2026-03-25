import { z } from "zod";

import { Order } from "@/lib/models/Order";
import { isObjectId, logApiError, parseJsonBody } from "@/lib/server/api";
import { requireAdmin } from "@/lib/server/auth";
import { connectToDatabase } from "@/lib/server/db";

const orderStatusSchema = z.object({
  orderId: z.string(),
  status: z.enum(["pending", "paid", "processing", "shipped", "out_for_delivery", "delivered", "cancelled"])
});

const allowedTransitions: Record<string, string[]> = {
  pending: ["processing", "cancelled"],
  paid: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["out_for_delivery"],
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
  const orders = await Order.find().sort({ createdAt: -1 }).lean();
  return Response.json({
    orders: (orders as any[]).map((order) => ({
      _id: order._id.toString(),
      status: order.status,
      total: order.total,
      createdAt: new Date(order.createdAt).toISOString(),
      customerName: order.shippingAddress?.fullName ?? "Customer",
      itemCount: order.items?.length ?? 0,
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

    if (!allowedTransitions[order.status]?.includes(parsed.data.status)) {
      return Response.json(
        { error: `Order cannot move from ${order.status.replaceAll("_", " ")} to ${parsed.data.status.replaceAll("_", " ")}.` },
        { status: 400 }
      );
    }

    if (["paid", "processing", "shipped", "out_for_delivery", "delivered"].includes(parsed.data.status) && order.payment?.status !== "paid") {
      return Response.json({ error: "Only paid orders can move into fulfilment stages." }, { status: 400 });
    }

    order.status = parsed.data.status;
    order.tracking = {
      ...order.tracking,
      timeline: [
        ...(order.tracking?.timeline ?? []),
        {
          status: parsed.data.status,
          label: `Order marked as ${parsed.data.status.replaceAll("_", " ")} by admin.`,
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
