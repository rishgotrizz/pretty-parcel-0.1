"use client";

import { BarChart3, MousePointerClick, Package, Percent, ShoppingCart, Users } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { formatCurrency, formatDate } from "@/lib/utils";

type DashboardPayload = {
  analytics: {
    summary: {
      totalRevenue: number;
      paidOrders: number;
      averageOrderValue: number;
      dailyRevenue: number;
      weeklyRevenue: number;
      monthlyRevenue: number;
      pageViews: number;
      clickEvents: number;
      cartEvents: number;
      wishlistEvents: number;
      abandonedCarts: number;
    };
    revenueTrend: Array<{ date: string; revenue: number }>;
    topExitPages: Array<{ path: string; count: number }>;
  };
  products: Array<{
    _id: string;
    name: string;
    category: string;
    shortDescription: string;
    description: string;
    stock: number;
    price: number;
    compareAtPrice?: number;
    images: string[];
    tags: string[];
    specifications: string[];
    customisationNotes?: string;
    isFeatured: boolean;
    isActive: boolean;
    flashSalePrice?: number;
    flashSaleEndsAt?: string;
  }>;
  orders: Array<{ _id: string; status: string; total: number; createdAt: string }>;
  coupons: Array<{ _id: string; code: string; type: string; value: number; autoApply: boolean }>;
};

const metricCards = [
  { key: "totalRevenue", label: "Revenue", icon: BarChart3, currency: true },
  { key: "paidOrders", label: "Paid orders", icon: ShoppingCart },
  { key: "averageOrderValue", label: "AOV", icon: Package, currency: true },
  { key: "abandonedCarts", label: "Abandoned carts", icon: Users }
] as const;

const orderStatuses = ["pending", "paid", "processing", "shipped", "out_for_delivery", "delivered", "cancelled"];

const blankProduct = {
  _id: "",
  name: "",
  category: "",
  shortDescription: "",
  description: "",
  stock: 0,
  price: 0,
  compareAtPrice: undefined,
  images: [],
  tags: [],
  specifications: [],
  customisationNotes: "",
  isFeatured: false,
  isActive: true,
  flashSalePrice: undefined,
  flashSaleEndsAt: ""
};

export function AdminDashboard() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [message, setMessage] = useState("");
  const [editingProduct, setEditingProduct] = useState<DashboardPayload["products"][number] | null>(null);

  async function readJson(response: Response) {
    try {
      const raw = await response.text();
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      console.error("[AdminDashboard] invalid API response", error);
      return {};
    }
  }

  async function loadDashboard() {
    try {
      const [analytics, products, orders, coupons] = await Promise.all([
        fetch("/api/admin/analytics", { credentials: "include", headers: { Accept: "application/json" } }).then(readJson),
        fetch("/api/admin/products", { credentials: "include", headers: { Accept: "application/json" } }).then(readJson),
        fetch("/api/admin/orders", { credentials: "include", headers: { Accept: "application/json" } }).then(readJson),
        fetch("/api/admin/coupons", { credentials: "include", headers: { Accept: "application/json" } }).then(readJson)
      ]);

      setData({
        analytics,
        products: products.products ?? [],
        orders: orders.orders ?? [],
        coupons: coupons.coupons ?? []
      });
    } catch (error) {
      console.error("[AdminDashboard] load failed", error);
      setMessage("We couldn't load the admin dashboard right now.");
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    const method = payload.id ? "PATCH" : "POST";

    try {
      const response = await fetch("/api/admin/products", {
        method,
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      });
      const result = await readJson(response);
      setMessage(response.ok ? "Product saved successfully." : result.error ?? "Could not save product.");
      if (response.ok) {
        setEditingProduct(null);
        await loadDashboard();
      }
    } catch (error) {
      console.error("[AdminDashboard] save product failed", error);
      setMessage("Could not save product.");
    }
  }

  async function createCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      });
      const result = await readJson(response);
      setMessage(response.ok ? "Coupon saved successfully." : result.error ?? "Could not save coupon.");
      if (response.ok) {
        event.currentTarget.reset();
        await loadDashboard();
      }
    } catch (error) {
      console.error("[AdminDashboard] create coupon failed", error);
      setMessage("Could not save coupon.");
    }
  }

  async function deleteProduct(id: string) {
    try {
      const response = await fetch(`/api/admin/products?id=${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: { Accept: "application/json" }
      });
      const result = await readJson(response);
      setMessage(response.ok ? "Product deleted." : result.error ?? "Could not delete product.");
      if (response.ok) {
        if (editingProduct?._id === id) {
          setEditingProduct(null);
        }
        await loadDashboard();
      }
    } catch (error) {
      console.error("[AdminDashboard] delete product failed", error);
      setMessage("Could not delete product.");
    }
  }

  async function deleteCoupon(id: string) {
    try {
      const response = await fetch(`/api/admin/coupons?id=${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: { Accept: "application/json" }
      });
      const result = await readJson(response);
      setMessage(response.ok ? "Coupon deleted." : result.error ?? "Could not delete coupon.");
      if (response.ok) {
        await loadDashboard();
      }
    } catch (error) {
      console.error("[AdminDashboard] delete coupon failed", error);
      setMessage("Could not delete coupon.");
    }
  }

  async function updateOrderStatus(id: string, status: string) {
    try {
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderId: id, status })
      });
      const result = await readJson(response);
      setMessage(response.ok ? "Order updated." : result.error ?? "Could not update order.");
      if (response.ok) {
        await loadDashboard();
      }
    } catch (error) {
      console.error("[AdminDashboard] update order failed", error);
      setMessage("Could not update order.");
    }
  }

  if (!data) {
    return <div className="section-shell py-14 text-sm text-rosewood/70">Loading admin dashboard...</div>;
  }

  const currentProduct = editingProduct ?? blankProduct;

  return (
    <div className="section-shell space-y-8 py-10">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card) => {
          const value = data.analytics.summary[card.key];
          const Icon = card.icon;
          return (
            <div key={card.key} className="glass-panel rounded-[2rem] border border-white/70 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-rosewood/70">{card.label}</p>
                <div className="rounded-full bg-white/90 p-3 text-berry">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-5 font-serif text-4xl text-cocoa">
                {"currency" in card && card.currency ? formatCurrency(value) : value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-panel rounded-[2rem] border border-white/70 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rosewood/70">Revenue trend</p>
              <h2 className="mt-2 font-serif text-3xl text-cocoa">Daily sales snapshot</h2>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-[1.25rem] bg-white/85 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.24em] text-rosewood/60">Today</p>
                <p className="mt-2 text-sm font-semibold text-cocoa">{formatCurrency(data.analytics.summary.dailyRevenue)}</p>
              </div>
              <div className="rounded-[1.25rem] bg-white/85 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.24em] text-rosewood/60">7 Days</p>
                <p className="mt-2 text-sm font-semibold text-cocoa">{formatCurrency(data.analytics.summary.weeklyRevenue)}</p>
              </div>
              <div className="rounded-[1.25rem] bg-white/85 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.24em] text-rosewood/60">30 Days</p>
                <p className="mt-2 text-sm font-semibold text-cocoa">{formatCurrency(data.analytics.summary.monthlyRevenue)}</p>
              </div>
            </div>
          </div>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.analytics.revenueTrend}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#8d5b69" stopOpacity={0.75} />
                    <stop offset="100%" stopColor="#f3b7c5" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(141,91,105,0.12)" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Area type="monotone" dataKey="revenue" stroke="#8d5b69" fill="url(#revenueFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel rounded-[2rem] border border-white/70 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rosewood/70">Activity overview</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              { label: "Page views", value: data.analytics.summary.pageViews, icon: BarChart3 },
              { label: "Clicks", value: data.analytics.summary.clickEvents, icon: MousePointerClick },
              { label: "Cart actions", value: data.analytics.summary.cartEvents, icon: ShoppingCart },
              { label: "Wishlist actions", value: data.analytics.summary.wishlistEvents, icon: Percent }
            ].map((item) => (
              <div key={item.label} className="rounded-[1.5rem] bg-white/85 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-rosewood/70">{item.label}</p>
                  <item.icon className="h-4 w-4 text-berry" />
                </div>
                <p className="mt-4 font-serif text-3xl text-cocoa">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-rosewood/60">Drop-off pages</p>
            <div className="mt-4 space-y-3">
              {data.analytics.topExitPages.map((page) => (
                <div key={page.path} className="flex items-center justify-between rounded-[1.25rem] bg-white/85 px-4 py-3">
                  <span className="truncate text-sm text-cocoa">{page.path}</span>
                  <span className="rounded-full bg-rosewater px-3 py-1 text-xs font-semibold text-rosewood">
                    {page.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {message ? <p className="text-sm font-medium text-rosewood">{message}</p> : null}

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="glass-panel rounded-[2rem] border border-white/70 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rosewood/70">
                {editingProduct ? "Edit product" : "Add product"}
              </p>
              <h2 className="mt-2 font-serif text-3xl text-cocoa">Product management</h2>
            </div>
            {editingProduct ? (
              <button type="button" onClick={() => setEditingProduct(null)} className="button-secondary !py-2">
                Clear form
              </button>
            ) : null}
          </div>

          <form key={currentProduct._id || "new"} onSubmit={saveProduct} className="mt-6 grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="id" value={currentProduct._id} />
            <input name="name" required defaultValue={currentProduct.name} placeholder="Product name" className="rounded-[1rem] border bg-white/90 px-4 py-3 text-sm" />
            <input name="category" required defaultValue={currentProduct.category} placeholder="Category" className="rounded-[1rem] border bg-white/90 px-4 py-3 text-sm" />
            <input
              name="price"
              required
              type="number"
              min="0"
              defaultValue={currentProduct.price}
              placeholder="Selling price"
              className="rounded-[1rem] border bg-white/90 px-4 py-3 text-sm"
            />
            <input
              name="compareAtPrice"
              type="number"
              min="0"
              defaultValue={currentProduct.compareAtPrice}
              placeholder="Original price / MRP"
              className="rounded-[1rem] border bg-white/90 px-4 py-3 text-sm"
            />
            <input
              name="stock"
              required
              type="number"
              min="0"
              defaultValue={currentProduct.stock}
              placeholder="Stock"
              className="rounded-[1rem] border bg-white/90 px-4 py-3 text-sm"
            />
            <input
              name="flashSalePrice"
              type="number"
              min="0"
              defaultValue={currentProduct.flashSalePrice}
              placeholder="Flash sale price"
              className="rounded-[1rem] border bg-white/90 px-4 py-3 text-sm"
            />
            <input
              name="flashSaleEndsAt"
              type="datetime-local"
              defaultValue={currentProduct.flashSaleEndsAt}
              className="rounded-[1rem] border bg-white/90 px-4 py-3 text-sm sm:col-span-2"
            />
            <input
              name="shortDescription"
              required
              defaultValue={currentProduct.shortDescription}
              placeholder="Short description"
              className="rounded-[1rem] border bg-white/90 px-4 py-3 text-sm sm:col-span-2"
            />
            <textarea
              name="description"
              required
              defaultValue={currentProduct.description}
              placeholder="Full description"
              className="min-h-28 rounded-[1rem] border bg-white/90 px-4 py-3 text-sm sm:col-span-2"
            />
            <textarea
              name="images"
              required
              defaultValue={currentProduct.images.join("\n")}
              placeholder="One image URL or local path per line"
              className="min-h-24 rounded-[1rem] border bg-white/90 px-4 py-3 text-sm sm:col-span-2"
            />
            <textarea
              name="tags"
              defaultValue={currentProduct.tags.join(", ")}
              placeholder="Tags separated by commas"
              className="min-h-20 rounded-[1rem] border bg-white/90 px-4 py-3 text-sm"
            />
            <textarea
              name="specifications"
              defaultValue={currentProduct.specifications.join("\n")}
              placeholder="Specifications, one per line"
              className="min-h-20 rounded-[1rem] border bg-white/90 px-4 py-3 text-sm"
            />
            <textarea
              name="customisationNotes"
              defaultValue={currentProduct.customisationNotes}
              placeholder="Customization notes"
              className="min-h-20 rounded-[1rem] border bg-white/90 px-4 py-3 text-sm sm:col-span-2"
            />
            <label className="flex items-center gap-2 rounded-[1rem] border bg-white/90 px-4 py-3 text-sm text-rosewood">
              <input name="isFeatured" type="checkbox" value="true" defaultChecked={currentProduct.isFeatured} />
              Featured product
            </label>
            <label className="flex items-center gap-2 rounded-[1rem] border bg-white/90 px-4 py-3 text-sm text-rosewood">
              <input name="isActive" type="checkbox" value="true" defaultChecked={currentProduct.isActive} />
              Visible in store
            </label>
            <button type="submit" className="button-primary sm:col-span-2">
              {editingProduct ? "Update product" : "Add product"}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="glass-panel rounded-[2rem] border border-white/70 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rosewood/70">Inventory</p>
                <h2 className="mt-2 font-serif text-3xl text-cocoa">{data.products.length} products in dashboard</h2>
              </div>
              <span className="rounded-full bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-rosewood">
                Admin CRUD
              </span>
            </div>
            <div className="mt-6 space-y-4">
              {data.products.map((product) => (
                <div key={product._id} className="rounded-[1.75rem] bg-white/85 p-4">
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <img src={product.images[0]} alt={product.name} className="h-24 w-full rounded-[1.25rem] object-cover sm:w-24" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-serif text-2xl text-cocoa">{product.name}</p>
                          <p className="mt-1 line-clamp-2 text-sm text-rosewood/75">{product.shortDescription}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-semibold text-cocoa">{formatCurrency(product.price)}</p>
                          {product.compareAtPrice ? (
                            <p className="text-xs text-rosewood/60 line-through">{formatCurrency(product.compareAtPrice)}</p>
                          ) : null}
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full bg-rosewater px-3 py-1 text-xs font-semibold text-rosewood">{product.category}</span>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-rosewood">
                          {product.stock} in stock
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-rosewood">
                          {product.isActive ? "Live" : "Hidden"}
                        </span>
                        {product.isFeatured ? (
                          <span className="rounded-full bg-berry px-3 py-1 text-xs font-semibold text-white">Featured</span>
                        ) : null}
                      </div>
                      <div className="mt-4 flex gap-2">
                        <button type="button" onClick={() => setEditingProduct(product)} className="button-secondary !py-2">
                          Edit
                        </button>
                        <button type="button" onClick={() => deleteProduct(product._id)} className="button-secondary !py-2">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] border border-white/70 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rosewood/70">Orders</p>
                <h2 className="mt-2 font-serif text-3xl text-cocoa">Track fulfilment</h2>
              </div>
              <span className="rounded-full bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-rosewood">
                {data.orders.length} total
              </span>
            </div>
            <div className="mt-6 space-y-3">
              {data.orders.map((order) => (
                <div key={order._id} className="rounded-[1.5rem] bg-white/85 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-cocoa">Order #{order._id.slice(-6).toUpperCase()}</p>
                      <p className="mt-1 text-sm text-rosewood/70">
                        {formatCurrency(order.total)} • {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <select
                      value={order.status}
                      onChange={(event) => updateOrderStatus(order._id, event.target.value)}
                      className="rounded-full border bg-white px-4 py-2 text-sm"
                    >
                      {orderStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="glass-panel rounded-[2rem] border border-white/70 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rosewood/70">Create coupon</p>
          <form onSubmit={createCoupon} className="mt-6 grid gap-3 sm:grid-cols-2">
            <input name="code" required placeholder="Code" className="rounded-[1rem] border bg-white/90 px-4 py-3 text-sm" />
            <select name="type" className="rounded-[1rem] border bg-white/90 px-4 py-3 text-sm">
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed</option>
            </select>
            <input name="value" required type="number" placeholder="Value" className="rounded-[1rem] border bg-white/90 px-4 py-3 text-sm" />
            <label className="flex items-center gap-2 rounded-[1rem] border bg-white/90 px-4 py-3 text-sm">
              <input name="autoApply" type="checkbox" value="true" />
              Auto apply
            </label>
            <button type="submit" className="button-primary sm:col-span-2">Save coupon</button>
          </form>
        </div>

        <div className="glass-panel rounded-[2rem] border border-white/70 p-6">
          <div className="flex items-center gap-3">
            <Percent className="h-5 w-5 text-berry" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rosewood/70">Coupons</p>
              <h2 className="mt-2 font-serif text-3xl text-cocoa">Discount management</h2>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {data.coupons.map((coupon) => (
              <div key={coupon._id} className="rounded-[1.5rem] bg-white/85 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-cocoa">{coupon.code}</p>
                    <p className="mt-2 text-sm text-rosewood/70">
                      {coupon.type} • {coupon.value}
                    </p>
                  </div>
                  {coupon.autoApply ? (
                    <span className="rounded-full bg-rosewater px-3 py-1 text-xs font-semibold text-rosewood">
                      Auto
                    </span>
                  ) : null}
                </div>
                <button type="button" onClick={() => deleteCoupon(coupon._id)} className="button-secondary mt-4 w-full !py-2">
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
