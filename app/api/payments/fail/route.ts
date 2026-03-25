import { z } from "zod";

import { Order } from "@/lib/models/Order";
import { isObjectId, logApiError, parseJsonBody } from "@/lib/server/api";
import { requireUser } from "@/lib/server/auth";
import { connectToDatabase } from "@/lib/server/db";

const failSchema = z.object({
  orderId: z.string(),
  reason: z.string().optional()
});

export async function POST(request: Request) {
  const user = await requireUser();
  if (user instanceof Response) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const parsed = failSchema.safeParse(await parseJsonBody(request));
    if (!parsed.success) {
      return Response.json({ error: "Invalid failure payload." }, { status: 400 });
    }
    if (!isObjectId(parsed.data.orderId)) {
      return Response.json({ error: "Invalid order id." }, { status: 400 });
    }

    await connectToDatabase();
    const order = await Order.findOne({ _id: parsed.data.orderId, user: user._id });
    if (!order) {
      return Response.json({ error: "Order not found." }, { status: 404 });
    }
    if (order.payment?.status === "paid") {
      return Response.json({ success: true, ignored: true });
    }

    order.payment = {
      ...order.payment,
      provider: order.payment?.provider ?? "razorpay",
      status: "failed",
      failureReason: parsed.data.reason || "Payment was not completed.",
      orderCreationLock: undefined,
      verificationLock: undefined
    };
    order.status = "pending";
    order.tracking = {
      ...order.tracking,
      timeline: [
        ...(order.tracking?.timeline ?? []),
        {
          status: "payment_failed",
          label: parsed.data.reason || "Payment was not completed.",
          at: new Date()
        }
      ]
    };
    await order.save();

    return Response.json({ success: true });
  } catch (error) {
    logApiError("api/payments/fail", error);
    return Response.json({ error: "We could not update the payment status right now." }, { status: 500 });
  }
}
