import { Types } from "mongoose";

import { Cart } from "@/lib/models/Cart";
import { Coupon } from "@/lib/models/Coupon";
import { Order } from "@/lib/models/Order";
import { Product } from "@/lib/models/Product";
import { connectToDatabase } from "@/lib/server/db";
import {
  pickBestCoupon,
  buildPricingSummary,
  getProductEffectivePrice,
  isCouponCurrentlyActive
} from "@/lib/server/pricing";
import { getRecommendationsForUser } from "@/lib/server/recommendations";
import { sampleProducts, sampleCategories } from "@/lib/server/sample-data";
import type { ProductType } from "@/types";

type SerializedOrder = {
  _id: string;
  user: string;
  items: Array<{
    productId: string;
    name: string;
    slug: string;
    image: string;
    quantity: number;
    unitPrice: number;
  }>;
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  couponCode?: string;
  status: string;
  customizationDetails?: {
    giftMessage?: string;
    nameCustomization?: string;
    specialInstructions?: string;
  };
  shippingAddress?: {
    fullName?: string;
    email?: string;
    phone?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  payment?: {
    invoiceNumber?: string;
  };
  tracking?: {
    trackingId?: string;
    estimatedDelivery?: string | Date;
    timeline?: Array<{
      status: string;
      label: string;
      at: string | Date;
    }>;
  };
  createdAt: string;
  updatedAt: string;
};

function normaliseProduct(product: Record<string, any>): ProductType {
  return {
    ...product,
    _id: product._id?.toString?.() ?? product._id,
    reviews:
      product.reviews?.map((review: Record<string, any>) => ({
        ...review,
        date: new Date(review.date).toISOString()
      })) ?? [],
    flashSale: product.flashSale?.endsAt
      ? {
          ...product.flashSale,
          endsAt: new Date(product.flashSale.endsAt).toISOString()
        }
      : product.flashSale
  } as ProductType;
}

function canUseSampleFallback() {
  return process.env.NODE_ENV !== "production";
}

export async function getCatalogProducts(): Promise<ProductType[]> {
  try {
    await connectToDatabase();
    const products = await Product.find({ isActive: true }).sort({ isFeatured: -1, popularity: -1 }).lean();
    if (!products.length && canUseSampleFallback()) {
      return sampleProducts;
    }
    return (products as any[]).map((product) => normaliseProduct(product as Record<string, any>));
  } catch {
    return canUseSampleFallback() ? sampleProducts : [];
  }
}

export async function getHomePageData(userId?: string | null): Promise<{
  featured: ProductType[];
  flashSale: ProductType[];
  recommendations: ProductType[];
  categories: string[];
}> {
  const products = await getCatalogProducts();
  const featured = products.filter((product: any) => product.isFeatured).slice(0, 4);
  const flashSale = products
    .filter((product: any) => product.flashSale?.isActive)
    .sort((a: any, b: any) => (a.flashSale?.price ?? a.price) - (b.flashSale?.price ?? b.price))
    .slice(0, 3);

  let recommendations = featured;
  if (userId) {
    try {
      recommendations = (await getRecommendationsForUser(userId)).map((product: any) =>
        normaliseProduct(product as Record<string, any>)
      );
    } catch {
      recommendations = featured;
    }
  }

  return {
    featured,
    flashSale,
    recommendations,
    categories: sampleCategories
  };
}

export async function getProductBySlug(slug: string): Promise<ProductType | null> {
  try {
    await connectToDatabase();
    const product = await Product.findOne({ slug, isActive: true }).lean();
    if (!product) {
      return canUseSampleFallback() ? (sampleProducts.find((item: any) => item.slug === slug) ?? null) : null;
    }
    return normaliseProduct(product as Record<string, any>);
  } catch {
    return canUseSampleFallback() ? (sampleProducts.find((item: any) => item.slug === slug) ?? null) : null;
  }
}

export async function getUserCart(userId: string) {
  await connectToDatabase();
  const cart = await Cart.findOne({ user: userId }).populate("items.product").lean<any>();
  if (!cart) {
    return {
      items: [],
      summary: buildPricingSummary({ subtotal: 0, discount: 0 }),
      appliedCoupon: null
    };
  }

  const items = cart.items
    .map((item: Record<string, any>) => {
      const product = item.product;
      if (!product) {
        return null;
      }
      const normalisedProduct = normaliseProduct(product);
      return {
        product: normalisedProduct,
        quantity: item.quantity,
        unitPrice: getProductEffectivePrice(normalisedProduct)
      };
    })
    .filter(Boolean) as Array<{ product: Record<string, any>; quantity: number; unitPrice: number }>;

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const categories = items.map((item) => (item.product as { category?: string })?.category ?? "");

  const coupons = await Coupon.find({
    isActive: true,
    ...(cart.couponCode ? { $or: [{ autoApply: true }, { code: cart.couponCode.toUpperCase() }] } : { autoApply: true })
  }).lean<any[]>();
  const validCoupons = (coupons as any[]).filter((coupon) => isCouponCurrentlyActive(coupon));
  const { coupon, discount } = pickBestCoupon(subtotal, categories, validCoupons as any[]);

  return {
    items,
    summary: buildPricingSummary({ subtotal, discount }),
    appliedCoupon: coupon ? { code: coupon.code, discount } : null
  };
}

export async function getWishlistProducts(productIds: string[]): Promise<ProductType[]> {
  if (!productIds.length) {
    return [];
  }

  try {
    await connectToDatabase();
    const objectIds = productIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    const products = await Product.find({ _id: { $in: objectIds }, isActive: true }).lean();
    return (products as any[]).map((product) => normaliseProduct(product as Record<string, any>));
  } catch {
    return canUseSampleFallback() ? sampleProducts.filter((product: any) => productIds.includes(product._id ?? "")) : [];
  }
}

export async function getUserOrders(userId: string): Promise<SerializedOrder[]> {
  await connectToDatabase();
  const orders = await Order.find({ user: userId }).sort({ createdAt: -1 }).lean();
  return (orders as any[]).map((order) => ({
    ...order,
    _id: order._id.toString(),
    user: order.user.toString(),
    createdAt: new Date(order.createdAt).toISOString(),
    updatedAt: new Date(order.updatedAt).toISOString()
  })) as SerializedOrder[];
}

export async function getOrderByIdForUser(
  orderId: string,
  userId: string,
  isAdmin = false
): Promise<SerializedOrder | null> {
  await connectToDatabase();
  const query = isAdmin ? { _id: orderId } : { _id: orderId, user: userId };
  const order = await Order.findOne(query).lean<any>();
  if (!order) {
    return null;
  }
  return {
    ...order,
    _id: order._id.toString(),
    user: order.user.toString(),
    createdAt: new Date(order.createdAt).toISOString(),
    updatedAt: new Date(order.updatedAt).toISOString()
  } as SerializedOrder;
}
