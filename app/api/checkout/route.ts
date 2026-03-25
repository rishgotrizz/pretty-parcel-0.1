import { z } from "zod";

import { Cart } from "@/lib/models/Cart";
import { Coupon } from "@/lib/models/Coupon";
import { Order } from "@/lib/models/Order";
import { isDuplicateKeyError, logApiError, parseJsonBody } from "@/lib/server/api";
import { requireUser } from "@/lib/server/auth";
import { connectToDatabase } from "@/lib/server/db";
import {
  buildPricingSummary,
  getProductEffectivePrice,
  isCouponCurrentlyActive,
  pickBestCoupon
} from "@/lib/server/pricing";

const checkoutSchema = z.object({
  checkoutSessionId: z.string().min(8),
  couponCode: z.string().optional().or(z.literal("")),
  shippingAddress: z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(10),
    line1: z.string().min(5),
    line2: z.string().optional().or(z.literal("")),
    city: z.string().min(2),
    state: z.string().min(2),
    postalCode: z.string().min(4)
  })
});

export async function POST(request: Request) {
  const user = await requireUser();
  if (user instanceof Response) {
    return Response.json({ error: "Please login before checkout." }, { status: 401 });
  }

  let checkoutSessionId = "";

  try {
    const rawPayload = await parseJsonBody(request);
    const parsed = checkoutSchema.safeParse(rawPayload);
    if (!parsed.success) {
      return Response.json({ error: "Please complete your shipping details." }, { status: 400 });
    }
    checkoutSessionId = parsed.data.checkoutSessionId;

    await connectToDatabase();

    const existingOrder = await Order.findOne({
      user: user._id,
      checkoutSessionId
    });
    if (existingOrder) {
      if (existingOrder.payment?.status === "paid") {
        return Response.json({ error: "This checkout session has already been completed." }, { status: 409 });
      }

      return Response.json({
        order: {
          _id: existingOrder._id.toString(),
          total: existingOrder.total,
          discount: existingOrder.discount,
          couponCode: existingOrder.couponCode
        }
      });
    }

    const cart = await Cart.findOne({ user: user._id }).populate("items.product");
    if (!cart || !cart.items.length) {
      return Response.json({ error: "Your cart is empty." }, { status: 400 });
    }

    const items = cart.items
      .map((item: any) => {
        const product = item.product;
        if (!product) {
          return null;
        }
        if (!product.isActive) {
          return {
            error: `${product.name} is no longer available.`
          };
        }
        if (product.stock < item.quantity) {
          return {
            error: `${product.name} does not have enough stock for this quantity.`
          };
        }
        const unitPrice = getProductEffectivePrice({
          price: product.price,
          flashSale: product.flashSale?.endsAt
            ? {
                isActive: product.flashSale.isActive,
                price: product.flashSale.price,
                endsAt: product.flashSale.endsAt.toISOString()
              }
            : undefined
        });
        return {
          productId: product._id,
          name: product.name,
          slug: product.slug,
          image: product.images[0],
          quantity: item.quantity,
          unitPrice,
          category: product.category
        };
      })
      .filter(Boolean) as Array<
        | { error: string }
        | {
            productId: string;
            name: string;
            slug: string;
            image: string;
            quantity: number;
            unitPrice: number;
            category: string;
          }
      >;

    const stockError = items.find((item) => "error" in item);
    if (stockError && "error" in stockError) {
      return Response.json({ error: stockError.error }, { status: 400 });
    }

    const validItems = items.filter(
      (item): item is Exclude<(typeof items)[number], { error: string }> => !("error" in item)
    );
    if (!validItems.length) {
      return Response.json({ error: "Your cart contains unavailable items." }, { status: 400 });
    }

    const subtotal = validItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const coupons = await Coupon.find({
      isActive: true,
      $or: [
        { autoApply: true },
        parsed.data.couponCode ? { code: parsed.data.couponCode.toUpperCase() } : { autoApply: true }
      ]
    }).lean();

    const eligibleCoupons = (coupons as any[]).filter((coupon) => isCouponCurrentlyActive(coupon));
    const { coupon, discount } = pickBestCoupon(
      subtotal,
      validItems.map((item) => item.category),
      eligibleCoupons as any[]
    );

    const pricing = buildPricingSummary({ subtotal, discount });
    const order = await Order.create({
      user: user._id,
      checkoutSessionId,
      items: validItems.map(({ category, ...item }) => item),
      subtotal: pricing.subtotal,
      discount: pricing.discount,
      shippingFee: pricing.shippingFee,
      total: pricing.total,
      couponCode: coupon?.code,
      status: "pending",
      shippingAddress: {
        ...parsed.data.shippingAddress,
        country: "India"
      },
      tracking: {
        timeline: [
          {
            status: "pending",
            label: "Order placed. Waiting for payment confirmation.",
            at: new Date()
          }
        ]
      }
    });

    return Response.json({
      order: {
        _id: order._id.toString(),
        total: order.total,
        discount: order.discount,
        couponCode: order.couponCode
      }
    });
  } catch (error) {
    if (isDuplicateKeyError(error) && checkoutSessionId) {
      const order = await Order.findOne({ user: user._id, checkoutSessionId });
      if (order) {
        return Response.json({
          order: {
            _id: order._id.toString(),
            total: order.total,
            discount: order.discount,
            couponCode: order.couponCode
          }
        });
      }
    }

    logApiError("api/checkout", error);
    return Response.json({ error: "We could not start checkout right now." }, { status: 500 });
  }
}
