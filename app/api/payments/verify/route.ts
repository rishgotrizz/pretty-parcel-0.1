import crypto from "crypto";
import { z } from "zod";

import { Cart } from "@/lib/models/Cart";
import { Order } from "@/lib/models/Order";
import { Product } from "@/lib/models/Product";
import { User } from "@/lib/models/User";
import { isDuplicateKeyError, isObjectId, logApiError, parseJsonBody } from "@/lib/server/api";
import { requireUser } from "@/lib/server/auth";
import { connectToDatabase } from "@/lib/server/db";
import { getEnv } from "@/lib/server/env";
import { verifyRazorpaySignature } from "@/lib/server/razorpay";

const verifySchema = z.object({
  orderId: z.string(),
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
  mock: z.boolean().optional()
});

async function reserveInventory(
  items: Array<{ productId: string; quantity: number }>
) {
  const reserved: Array<{ productId: string; quantity: number }> = [];

  for (const item of items) {
    const result = await Product.updateOne(
      {
        _id: item.productId,
        isActive: true,
        stock: { $gte: item.quantity }
      },
      {
        $inc: { stock: -item.quantity, popularity: 2 }
      }
    );

    if (result.modifiedCount !== 1) {
      if (reserved.length) {
        await Product.bulkWrite(
          reserved.map((reservedItem) => ({
            updateOne: {
              filter: { _id: reservedItem.productId },
              update: { $inc: { stock: reservedItem.quantity, popularity: -2 } }
            }
          }))
        );
      }

      return false;
    }

    reserved.push(item);
  }

  return true;
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (user instanceof Response) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const parsed = verifySchema.safeParse(await parseJsonBody(request));
    if (!parsed.success) {
      return Response.json({ error: "Invalid verification payload." }, { status: 400 });
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
      return Response.json({
        success: true,
        orderId: order._id.toString(),
        alreadyProcessed: true
      });
    }
    if (!order.payment?.razorpayOrderId) {
      return Response.json({ error: "Payment has not been initialized for this order." }, { status: 409 });
    }
    if (order.payment.razorpayOrderId !== parsed.data.razorpayOrderId) {
      return Response.json({ error: "Payment order mismatch." }, { status: 400 });
    }

    const { enableMockPayments } = getEnv();
    const isMockVerification =
      Boolean(parsed.data.mock) &&
      enableMockPayments &&
      parsed.data.razorpayOrderId.startsWith("mock_");

    const isValidSignature =
      isMockVerification ||
      verifyRazorpaySignature({
        orderId: parsed.data.razorpayOrderId,
        paymentId: parsed.data.razorpayPaymentId,
        signature: parsed.data.razorpaySignature
      });

    const verificationLock = crypto.randomUUID();
    const lockedOrder = await Order.findOneAndUpdate(
      {
        _id: order._id,
        user: user._id,
        "payment.status": { $in: ["pending", "failed"] },
        $or: [
          { "payment.verificationLock": { $exists: false } },
          { "payment.verificationLock": null }
        ]
      },
      {
        $set: {
          "payment.verificationLock": verificationLock
        }
      },
      { new: true }
    );

    if (!lockedOrder) {
      const latestOrder = await Order.findOne({ _id: order._id, user: user._id }).lean<any>();
      if (latestOrder?.payment?.status === "paid") {
        return Response.json({
          success: true,
          orderId: order._id.toString(),
          alreadyProcessed: true
        });
      }

      return Response.json({ error: "Payment verification is already in progress." }, { status: 409 });
    }

    if (!isValidSignature) {
      lockedOrder.payment = {
        ...lockedOrder.payment,
        status: "failed",
        razorpayOrderId: parsed.data.razorpayOrderId,
        razorpayPaymentId: parsed.data.razorpayPaymentId,
        razorpaySignature: parsed.data.razorpaySignature,
        failureReason: "Payment verification failed.",
        verificationLock: undefined
      };
      lockedOrder.tracking = {
        ...lockedOrder.tracking,
        timeline: [
          ...(lockedOrder.tracking?.timeline ?? []),
          {
            status: "payment_failed",
            label: "Payment verification failed. No charge was recorded on the order.",
            at: new Date()
          }
        ]
      };
      await lockedOrder.save();
      return Response.json({ error: "Payment verification failed." }, { status: 400 });
    }

    const inventoryReserved = await reserveInventory(
      lockedOrder.items.map((item: { productId: { toString(): string }; quantity: number }) => ({
        productId: item.productId.toString(),
        quantity: item.quantity
      }))
    );

    const invoiceNumber = lockedOrder.payment?.invoiceNumber ?? `TPP-${String(lockedOrder._id).slice(-6).toUpperCase()}`;
    const now = new Date();

    lockedOrder.payment = {
      ...lockedOrder.payment,
      provider: "razorpay",
      status: "paid",
      razorpayOrderId: parsed.data.razorpayOrderId,
      razorpayPaymentId: parsed.data.razorpayPaymentId,
      razorpaySignature: parsed.data.razorpaySignature,
      invoiceNumber,
      verifiedAt: now,
      failureReason: undefined,
      verificationLock: undefined
    };

    if (inventoryReserved) {
      lockedOrder.status = "processing";
      lockedOrder.tracking = {
        trackingId: lockedOrder.tracking?.trackingId ?? `PP${String(lockedOrder._id).slice(-8).toUpperCase()}`,
        estimatedDelivery: lockedOrder.tracking?.estimatedDelivery ?? new Date(Date.now() + 1000 * 60 * 60 * 24 * 4),
        timeline: [
          ...(lockedOrder.tracking?.timeline ?? []),
          {
            status: "paid",
            label: "Payment confirmed. Your order is now being prepared.",
            at: now
          },
          {
            status: "processing",
            label: "Artisans are preparing your handmade parcel.",
            at: new Date(Date.now() + 1000 * 60 * 20)
          }
        ]
      };
      await lockedOrder.save();
      await Cart.findOneAndUpdate({ user: user._id }, { $set: { items: [], couponCode: null } });
      await User.findByIdAndUpdate(user._id, { $inc: { orderCount: 1 }, $set: { lastSeenAt: now } });

      return Response.json({
        success: true,
        orderId: lockedOrder._id.toString()
      });
    }

    lockedOrder.status = "paid";
    lockedOrder.tracking = {
      ...lockedOrder.tracking,
      timeline: [
        ...(lockedOrder.tracking?.timeline ?? []),
        {
          status: "paid",
          label: "Payment confirmed. Inventory changed during checkout, so this order needs manual review before fulfillment.",
          at: now
        }
      ]
    };
    await lockedOrder.save();
    await Cart.findOneAndUpdate({ user: user._id }, { $set: { items: [], couponCode: null } });
    await User.findByIdAndUpdate(user._id, { $inc: { orderCount: 1 }, $set: { lastSeenAt: now } });

    return Response.json({
      success: true,
      orderId: lockedOrder._id.toString(),
      needsReview: true
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return Response.json({ error: "This payment has already been linked to another order." }, { status: 409 });
    }

    logApiError("api/payments/verify", error);
    return Response.json({ error: "We could not verify your payment right now." }, { status: 500 });
  }
}
