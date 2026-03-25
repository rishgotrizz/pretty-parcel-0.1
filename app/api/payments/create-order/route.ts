import crypto from "crypto";
import { z } from "zod";

import { Order } from "@/lib/models/Order";
import { Product } from "@/lib/models/Product";
import { isObjectId, logApiError, parseJsonBody } from "@/lib/server/api";
import { requireUser } from "@/lib/server/auth";
import { connectToDatabase } from "@/lib/server/db";
import { getEnv } from "@/lib/server/env";
import { getRazorpayClient } from "@/lib/server/razorpay";

function createMockOrderId(orderId: string) {
  return `mock_${orderId}`;
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (user instanceof Response) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const parsed = z.object({ orderId: z.string() }).safeParse(await parseJsonBody(request));
    if (!parsed.success) {
      return Response.json({ error: "Invalid payment request." }, { status: 400 });
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
      return Response.json({ error: "This order has already been paid." }, { status: 409 });
    }
    if (order.status === "cancelled") {
      return Response.json({ error: "This order can no longer be paid." }, { status: 409 });
    }

    const products = await Product.find({
      _id: { $in: order.items.map((item: { productId: string }) => item.productId) }
    })
      .select("_id stock isActive")
      .lean<any[]>();
    const productMap = new Map(products.map((product) => [product._id.toString(), product]));
    const unavailableItem = order.items.find((item: { productId: { toString(): string }; quantity: number }) => {
      const product = productMap.get(item.productId.toString());
      return !product || !product.isActive || product.stock < item.quantity;
    });
    if (unavailableItem) {
      return Response.json(
        { error: `${unavailableItem.name} is no longer available in the selected quantity.` },
        { status: 409 }
      );
    }

    const { enableMockPayments, nextPublicRazorpayKeyId, razorpayKeyId } = getEnv();
    const publicKey = nextPublicRazorpayKeyId ?? razorpayKeyId;

    if (order.payment?.razorpayOrderId && order.payment.status === "pending" && !order.payment.orderCreationLock) {
      return Response.json({
        mock: order.payment.razorpayOrderId.startsWith("mock_"),
        key: publicKey,
        razorpayOrderId: order.payment.razorpayOrderId,
        amount: order.total * 100
      });
    }

    if (order.payment?.orderCreationLock) {
      return Response.json({ error: "Payment is being initialized. Please try again." }, { status: 409 });
    }

    const creationLock = crypto.randomUUID();
    const lockedOrder = await Order.findOneAndUpdate(
      {
        _id: order._id,
        user: user._id,
        "payment.status": { $in: ["pending", "failed", null] },
        $or: [
          { "payment.orderCreationLock": { $exists: false } },
          { "payment.orderCreationLock": null }
        ]
      },
      {
        $set: {
          "payment.provider": "razorpay",
          "payment.status": "pending",
          "payment.orderCreationLock": creationLock,
          "payment.failureReason": null
        },
        $unset: {
          "payment.razorpayOrderId": "",
          "payment.razorpayPaymentId": "",
          "payment.razorpaySignature": "",
          "payment.verifiedAt": ""
        }
      },
      { new: true }
    );

    if (!lockedOrder) {
      const latestOrder = await Order.findOne({ _id: parsed.data.orderId, user: user._id });
      if (latestOrder?.payment?.status === "paid") {
        return Response.json({ error: "This order has already been paid." }, { status: 409 });
      }
      if (latestOrder?.payment?.razorpayOrderId && !latestOrder.payment.orderCreationLock) {
        return Response.json({
          mock: latestOrder.payment.razorpayOrderId.startsWith("mock_"),
          key: publicKey,
          razorpayOrderId: latestOrder.payment.razorpayOrderId,
          amount: latestOrder.total * 100
        });
      }

      return Response.json({ error: "Payment is being initialized. Please try again." }, { status: 409 });
    }

    let razorpay;
    try {
      razorpay = getRazorpayClient();
    } catch (error) {
      await Order.updateOne(
        { _id: lockedOrder._id, "payment.orderCreationLock": creationLock },
        {
          $set: {
            "payment.status": "failed",
            "payment.failureReason":
              error instanceof Error ? error.message : "Payment configuration error."
          },
          $unset: { "payment.orderCreationLock": "" }
        }
      );
      return Response.json(
        { error: error instanceof Error ? error.message : "Payment configuration error." },
        { status: 500 }
      );
    }

    if (!razorpay) {
      const mockOrderId = createMockOrderId(order._id.toString());
      await Order.updateOne(
        { _id: lockedOrder._id, "payment.orderCreationLock": creationLock },
        {
          $set: {
            "payment.provider": "razorpay",
            "payment.status": "pending",
            "payment.razorpayOrderId": mockOrderId
          },
          $unset: {
            "payment.orderCreationLock": "",
            "payment.failureReason": ""
          }
        }
      );
      return Response.json({
        mock: true,
        razorpayOrderId: mockOrderId,
        amount: order.total * 100
      });
    }

    try {
      const paymentOrder = await razorpay.orders.create({
        amount: order.total * 100,
        currency: "INR",
        receipt: order._id.toString()
      });

      await Order.updateOne(
        { _id: lockedOrder._id, "payment.orderCreationLock": creationLock },
        {
          $set: {
            "payment.provider": "razorpay",
            "payment.status": "pending",
            "payment.razorpayOrderId": paymentOrder.id
          },
          $unset: {
            "payment.orderCreationLock": "",
            "payment.failureReason": ""
          }
        }
      );

      return Response.json({
        key: publicKey,
        razorpayOrderId: paymentOrder.id,
        amount: paymentOrder.amount
      });
    } catch (error) {
      if (enableMockPayments) {
        const mockOrderId = createMockOrderId(order._id.toString());
        await Order.updateOne(
          { _id: lockedOrder._id, "payment.orderCreationLock": creationLock },
          {
            $set: {
              "payment.provider": "razorpay",
              "payment.status": "pending",
              "payment.razorpayOrderId": mockOrderId
            },
            $unset: {
              "payment.orderCreationLock": "",
              "payment.failureReason": ""
            }
          }
        );
        return Response.json({
          mock: true,
          razorpayOrderId: mockOrderId,
          amount: order.total * 100
        });
      }

      await Order.updateOne(
        { _id: lockedOrder._id, "payment.orderCreationLock": creationLock },
        {
          $set: {
            "payment.status": "failed",
            "payment.failureReason":
              error instanceof Error ? error.message : "Unable to create Razorpay order."
          },
          $unset: { "payment.orderCreationLock": "" }
        }
      );

      return Response.json(
        {
          error: error instanceof Error ? error.message : "Unable to create Razorpay order."
        },
        { status: 502 }
      );
    }
  } catch (error) {
    logApiError("api/payments/create-order", error);
    return Response.json({ error: "We could not initialize your payment right now." }, { status: 500 });
  }
}
