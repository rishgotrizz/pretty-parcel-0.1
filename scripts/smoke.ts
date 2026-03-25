import "dotenv/config";

import dotenv from "dotenv";

import { Cart } from "@/lib/models/Cart";
import { Coupon } from "@/lib/models/Coupon";
import { Product } from "@/lib/models/Product";
import { User } from "@/lib/models/User";
import { hashPassword } from "@/lib/server/auth";
import { connectToDatabase } from "@/lib/server/db";
import { getEnv } from "@/lib/server/env";
import { sampleCoupons, sampleProducts } from "@/lib/server/sample-data";

dotenv.config({ path: ".env.local" });
dotenv.config();

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const adminEmail = process.env.ADMIN_EMAIL ?? "admin@theprettyparcel.com";
const adminPassword = process.env.ADMIN_PASSWORD ?? "PrettyParcel@123";

class CookieJar {
  private cookie = "";

  apply(headers: HeadersInit = {}) {
    const nextHeaders = new Headers(headers);
    if (this.cookie) {
      nextHeaders.set("cookie", this.cookie);
    }
    return nextHeaders;
  }

  store(response: Response) {
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) {
      this.cookie = setCookie.split(",")[0].split(";")[0];
    }
  }
}

async function request(
  jar: CookieJar,
  path: string,
  init: RequestInit = {}
) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: jar.apply(init.headers)
  });
  jar.store(response);
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(`${path} failed: ${response.status} ${JSON.stringify(data)}`);
  }
  return data;
}

async function expectFailure(
  jar: CookieJar,
  path: string,
  status: number,
  init: RequestInit = {}
) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: jar.apply(init.headers)
  });
  jar.store(response);
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (response.status !== status) {
    throw new Error(`${path} expected ${status} but received ${response.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

async function ensureBaseData() {
  const env = getEnv();
  await connectToDatabase();

  for (const product of sampleProducts) {
    await Product.findOneAndUpdate(
      { slug: product.slug },
      {
        ...product,
        reviews: product.reviews.map((review) => ({
          ...review,
          date: new Date(review.date)
        })),
        flashSale: product.flashSale
          ? {
              ...product.flashSale,
              endsAt: new Date(product.flashSale.endsAt)
            }
          : undefined
      },
      { upsert: true, new: true }
    );
  }

  for (const coupon of sampleCoupons) {
    await Coupon.findOneAndUpdate(
      { code: coupon.code },
      {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        autoApply: coupon.autoApply,
        isActive: true,
        minOrderValue: 999
      },
      { upsert: true, new: true }
    );
  }

  const admin = await User.findOneAndUpdate(
    { email: env.adminEmail.toLowerCase() },
    {
      name: "Pretty Parcel Admin",
      email: env.adminEmail.toLowerCase(),
      password: await hashPassword(env.adminPassword),
      role: "admin",
      wishlist: [],
      preferences: {
        favoriteCategories: ["Bouquets", "Gift Hampers"]
      },
      lastSeenAt: new Date()
    },
    { upsert: true, new: true }
  );

  await Cart.findOneAndUpdate({ user: admin._id }, { user: admin._id, items: [] }, { upsert: true, new: true });
}

async function main() {
  const health = await fetch(`${baseUrl}/api/health`).then((response) => response.json());
  if (!health.ok) {
    throw new Error(`Health check failed: ${JSON.stringify(health)}`);
  }

  const adminJar = new CookieJar();
  try {
    await request(adminJar, "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: adminEmail, password: adminPassword })
    });
  } catch (error) {
    console.warn("[smoke] admin login failed, seeding baseline data and retrying");
    await ensureBaseData();
    await request(adminJar, "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: adminEmail, password: adminPassword })
    });
  }

  const adminProducts = await request(adminJar, "/api/admin/products");
  if (!adminProducts.products?.length) {
    await ensureBaseData();
  }

  const tempName = `Smoke Test Product ${Date.now()}`;
  const created = await request(adminJar, "/api/admin/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: tempName,
      category: "Gift Hampers",
      shortDescription: "Smoke test product for admin CRUD validation.",
      description: "Smoke test product created to validate admin create, update, and delete flows.",
      price: 999,
      compareAtPrice: 1299,
      stock: 7,
      images: ["/hamper.svg"],
      tags: ["smoke", "test"],
      specifications: ["Spec one", "Spec two"],
      customisationNotes: "Smoke note",
      isFeatured: false,
      isActive: true
    })
  });

  await request(adminJar, "/api/admin/products", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: created.product._id,
      name: `${tempName} Updated`,
      category: "Gift Hampers",
      shortDescription: "Updated smoke test product short description.",
      description: "Updated smoke test product description to verify admin edit flow.",
      price: 1099,
      compareAtPrice: 1399,
      stock: 5,
      images: ["/hamper.svg", "/hero-pretty-parcel.svg"],
      tags: ["smoke", "updated"],
      specifications: ["Updated spec"],
      customisationNotes: "Updated note",
      isFeatured: true,
      isActive: true,
      flashSalePrice: 999,
      flashSaleEndsAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString().slice(0, 16)
    })
  });

  const customerJar = new CookieJar();
  const customerEmail = `smoke-${Date.now()}@example.com`;
  await request(customerJar, "/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Smoke Customer",
      email: customerEmail,
      password: "SmokePass123"
    })
  });

  await request(customerJar, "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: customerEmail,
      password: "SmokePass123"
    })
  });

  await request(customerJar, "/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId: created.product._id, quantity: 1 })
  });

  await request(customerJar, "/api/cart", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId: created.product._id, quantity: 2 })
  });

  const cart = await request(customerJar, "/api/cart");
  if (!cart.items?.length) {
    throw new Error("Cart smoke check failed.");
  }

  const checkoutSessionId = crypto.randomUUID();
  const checkout = await request(customerJar, "/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      checkoutSessionId,
      couponCode: "PRETTY10",
      shippingAddress: {
        fullName: "Smoke Customer",
        email: customerEmail,
        phone: "9999999999",
        line1: "123 Testing Street",
        line2: "Apt 4",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400001"
      }
    })
  });

  const paymentOrder = await request(customerJar, "/api/payments/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId: checkout.order._id })
  });

  await expectFailure(customerJar, "/api/payments/verify", 400, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      orderId: checkout.order._id,
      razorpayOrderId: paymentOrder.razorpayOrderId,
      razorpayPaymentId: `bad_${Date.now()}`,
      razorpaySignature: "invalid_signature"
    })
  });

  const retriedPaymentOrder = await request(customerJar, "/api/payments/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId: checkout.order._id })
  });

  await request(customerJar, "/api/payments/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      orderId: checkout.order._id,
      razorpayOrderId: retriedPaymentOrder.razorpayOrderId,
      razorpayPaymentId: `demo_${Date.now()}`,
      razorpaySignature: "mock_signature",
      mock: true
    })
  });

  const orders = await request(customerJar, "/api/orders");
  if (!orders.orders?.length) {
    throw new Error("Order smoke check failed.");
  }

  await request(adminJar, `/api/admin/products?id=${created.product._id}`, {
    method: "DELETE"
  });

  console.log("Smoke test passed:");
  console.log("- admin login");
  console.log("- product create/update/delete");
  console.log("- customer signup/login");
  console.log("- cart add/update");
  console.log("- checkout and payment verification");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
