"use client";

import {
  BarChart3,
  ImagePlus,
  MousePointerClick,
  Package,
  Percent,
  RefreshCcw,
  ShoppingBag,
  Sparkles,
  Users
} from "lucide-react";
import { useEffect, useState, type ChangeEvent, type ComponentType, type FormEvent } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { useToast } from "@/components/providers/toast-provider";
import { formatCurrency, formatDate } from "@/lib/utils";

type ProductAdminItem = {
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
};

type DashboardPayload = {
  analytics: {
    summary: {
      totalRevenue: number;
      totalUsers: number;
      newUsers: number;
      repeatCustomers: number;
      totalOrders: number;
      totalProducts: number;
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
  products: ProductAdminItem[];
  orders: Array<{
    _id: string;
    status: string;
    total: number;
    createdAt: string;
    customerName: string;
    itemCount: number;
    customizationDetails?: {
      giftMessage?: string;
      nameCustomization?: string;
      specialInstructions?: string;
    } | null;
  }>;
  coupons: Array<{ _id: string; code: string; type: string; value: number; autoApply: boolean }>;
};

const topMetricCards = [
  { key: "totalUsers", label: "Customers", icon: Users },
  { key: "newUsers", label: "New in 7 days", icon: Sparkles },
  { key: "repeatCustomers", label: "Repeat customers", icon: RefreshCcw },
  { key: "totalOrders", label: "Orders", icon: ShoppingBag },
  { key: "totalProducts", label: "Products", icon: Package }
] as const;

const revenueMetricCards = [
  { key: "totalRevenue", label: "Revenue", icon: BarChart3, currency: true },
  { key: "paidOrders", label: "Paid orders", icon: ShoppingBag },
  { key: "averageOrderValue", label: "AOV", icon: Package, currency: true },
  { key: "abandonedCarts", label: "Abandoned carts", icon: Users }
] as const;

const orderStatuses = ["pending", "paid", "processing", "shipped", "out_for_delivery", "delivered", "cancelled"];

const blankProduct: ProductAdminItem = {
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

function ProductMetricCard({
  label,
  value,
  icon: Icon,
  currency = false
}: {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
  currency?: boolean;
}) {
  return (
    <div className="glass-panel rounded-[2rem] border border-white/70 p-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-rosewood/70">{label}</p>
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-berry">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-5 font-serif text-3xl text-cocoa sm:text-4xl">
        {currency ? formatCurrency(value) : value}
      </p>
    </div>
  );
}

export function AdminDashboard() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [message, setMessage] = useState("");
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [savingProduct, setSavingProduct] = useState(false);
  const [savingCoupon, setSavingCoupon] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [activeDeleteId, setActiveDeleteId] = useState("");
  const [activeOrderId, setActiveOrderId] = useState("");
  const [editingProduct, setEditingProduct] = useState<ProductAdminItem | null>(null);
  const [productImages, setProductImages] = useState<string[]>([]);
  const { pushToast } = useToast();

  useEffect(() => {
    setProductImages(editingProduct?.images ?? []);
  }, [editingProduct]);

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
      setLoadingDashboard(true);
      const [analyticsResponse, productsResponse, ordersResponse, couponsResponse] = await Promise.all([
        fetch("/api/admin/analytics", { credentials: "include", headers: { Accept: "application/json" } }),
        fetch("/api/admin/products", { credentials: "include", headers: { Accept: "application/json" } }),
        fetch("/api/admin/orders", { credentials: "include", headers: { Accept: "application/json" } }),
        fetch("/api/admin/coupons", { credentials: "include", headers: { Accept: "application/json" } })
      ]);

      const [analytics, products, orders, coupons] = await Promise.all([
        readJson(analyticsResponse),
        readJson(productsResponse),
        readJson(ordersResponse),
        readJson(couponsResponse)
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
      pushToast("We couldn't load the admin dashboard right now.", "error");
    } finally {
      setLoadingDashboard(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  function clearProductForm() {
    setEditingProduct(null);
    setProductImages([]);
  }

  async function handleImageSelection(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) {
      return;
    }

    try {
      setUploadingImages(true);
      const encodedImages = await Promise.all(
        files.map(
          (file) =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(String(reader.result ?? ""));
              reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
              reader.readAsDataURL(file);
            })
        )
      );
      setProductImages((current) => [...current, ...encodedImages.filter(Boolean)]);
      pushToast("Image ready for preview and save.", "success");
      event.target.value = "";
    } catch (error) {
      console.error("[AdminDashboard] image upload failed", error);
      pushToast("We couldn't prepare that image.", "error");
    } finally {
      setUploadingImages(false);
    }
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!productImages.length) {
      setMessage("Please upload at least one product image.");
      pushToast("Please upload at least one product image.", "error");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    const method = payload.id ? "PATCH" : "POST";

    try {
      setSavingProduct(true);
      const response = await fetch("/api/admin/products", {
        method,
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...payload,
          images: productImages
        })
      });
      const result = await readJson(response);
      if (!response.ok) {
        setMessage(result.error ?? "Could not save product.");
        pushToast(result.error ?? "Could not save product.", "error");
        return;
      }

      if (result.product) {
        setData((current) =>
          current
            ? {
                ...current,
                products: payload.id
                  ? current.products.map((product) => (product._id === result.product._id ? result.product : product))
                  : [result.product, ...current.products]
              }
            : current
        );
      }

      setMessage(payload.id ? "Product updated successfully." : "Product created successfully.");
      pushToast(payload.id ? "Product updated successfully." : "Product created successfully.", "success");
      clearProductForm();
      void loadDashboard();
    } catch (error) {
      console.error("[AdminDashboard] save product failed", error);
      setMessage("Could not save product.");
      pushToast("Could not save product.", "error");
    } finally {
      setSavingProduct(false);
    }
  }

  async function createCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      setSavingCoupon(true);
      const response = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      });
      const result = await readJson(response);
      if (!response.ok) {
        setMessage(result.error ?? "Could not save coupon.");
        pushToast(result.error ?? "Could not save coupon.", "error");
        return;
      }

      setMessage("Coupon saved successfully.");
      pushToast("Coupon saved successfully.", "success");
      event.currentTarget.reset();
      void loadDashboard();
    } catch (error) {
      console.error("[AdminDashboard] create coupon failed", error);
      setMessage("Could not save coupon.");
      pushToast("Could not save coupon.", "error");
    } finally {
      setSavingCoupon(false);
    }
  }

  async function deleteProduct(id: string) {
    try {
      setActiveDeleteId(id);
      const response = await fetch(`/api/admin/products?id=${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: { Accept: "application/json" }
      });
      const result = await readJson(response);
      if (!response.ok) {
        setMessage(result.error ?? "Could not delete product.");
        pushToast(result.error ?? "Could not delete product.", "error");
        return;
      }

      setData((current) =>
        current
          ? {
              ...current,
              products: current.products.filter((product) => product._id !== id)
            }
          : current
      );
      if (editingProduct?._id === id) {
        clearProductForm();
      }
      setMessage("Product deleted.");
      pushToast("Product deleted.", "success");
      void loadDashboard();
    } catch (error) {
      console.error("[AdminDashboard] delete product failed", error);
      setMessage("Could not delete product.");
      pushToast("Could not delete product.", "error");
    } finally {
      setActiveDeleteId("");
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
      if (!response.ok) {
        setMessage(result.error ?? "Could not delete coupon.");
        pushToast(result.error ?? "Could not delete coupon.", "error");
        return;
      }

      setData((current) =>
        current
          ? {
              ...current,
              coupons: current.coupons.filter((coupon) => coupon._id !== id)
            }
          : current
      );
      setMessage("Coupon deleted.");
      pushToast("Coupon deleted.", "success");
    } catch (error) {
      console.error("[AdminDashboard] delete coupon failed", error);
      setMessage("Could not delete coupon.");
      pushToast("Could not delete coupon.", "error");
    }
  }

  async function updateOrderStatus(id: string, status: string) {
    try {
      setActiveOrderId(id);
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderId: id, status })
      });
      const result = await readJson(response);
      if (!response.ok) {
        setMessage(result.error ?? "Could not update order.");
        pushToast(result.error ?? "Could not update order.", "error");
        return;
      }

      setData((current) =>
        current
          ? {
              ...current,
              orders: current.orders.map((order) => (order._id === id ? { ...order, status } : order))
            }
          : current
      );
      setMessage("Order updated.");
      pushToast("Order updated.", "success");
    } catch (error) {
      console.error("[AdminDashboard] update order failed", error);
      setMessage("Could not update order.");
      pushToast("Could not update order.", "error");
    } finally {
      setActiveOrderId("");
    }
  }

  if (loadingDashboard || !data) {
    return <div className="section-shell py-14 text-sm text-rosewood/70">Loading admin dashboard...</div>;
  }

  const currentProduct = editingProduct ?? blankProduct;

  return (
    <div className="section-shell space-y-8 py-10">
      <div className="flex flex-col gap-4 rounded-[2.5rem] bg-gradient-to-r from-white/90 via-pink-50/90 to-rosewater p-6 shadow-[var(--shadow-card)] lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-rosewood/65">Admin dashboard</p>
          <h1 className="mt-3 font-serif text-4xl text-cocoa sm:text-5xl">Run your gifting store with confidence.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-rosewood/80">
            Track customers, orders, products, and custom gift instructions in one clean workspace.
          </p>
        </div>
        <button type="button" onClick={() => void loadDashboard()} className="button-secondary self-start lg:self-auto">
          <RefreshCcw className="h-4 w-4" />
          Refresh dashboard
        </button>
      </div>

      {message ? <p className="text-sm font-medium text-rosewood">{message}</p> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {topMetricCards.map((card) => (
          <ProductMetricCard
            key={card.key}
            label={card.label}
            value={data.analytics.summary[card.key]}
            icon={card.icon}
          />
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {revenueMetricCards.map((card) => (
          <ProductMetricCard
            key={card.key}
            label={card.label}
            value={data.analytics.summary[card.key]}
            icon={card.icon}
            currency={"currency" in card && card.currency}
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
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
              { label: "Cart actions", value: data.analytics.summary.cartEvents, icon: ShoppingBag },
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
              {data.analytics.topExitPages.length ? (
                data.analytics.topExitPages.map((page) => (
                  <div key={page.path} className="flex items-center justify-between rounded-[1.25rem] bg-white/85 px-4 py-3">
                    <span className="truncate text-sm text-cocoa">{page.path}</span>
                    <span className="rounded-full bg-rosewater px-3 py-1 text-xs font-semibold text-rosewood">
                      {page.count}
                    </span>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.25rem] bg-white/85 px-4 py-3 text-sm text-rosewood/70">
                  Exit-page insights will appear as shoppers browse.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="glass-panel rounded-[2rem] border border-white/70 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rosewood/70">
                {editingProduct ? "Edit product" : "Add product"}
              </p>
              <h2 className="mt-2 font-serif text-3xl text-cocoa">Product management</h2>
            </div>
            {editingProduct ? (
              <button type="button" onClick={clearProductForm} className="button-secondary !py-2">
                Clear form
              </button>
            ) : null}
          </div>

          <form key={currentProduct._id || "new"} onSubmit={saveProduct} className="mt-6 grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="id" value={currentProduct._id} />
            <input
              name="name"
              required
              defaultValue={currentProduct.name}
              placeholder="Product name"
              className="rounded-[1rem] border bg-white/90 px-4 py-3 text-sm"
            />
            <input
              name="category"
              required
              defaultValue={currentProduct.category}
              placeholder="Category"
              className="rounded-[1rem] border bg-white/90 px-4 py-3 text-sm"
            />
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

            <div className="rounded-[1.5rem] border border-dashed border-pink-200 bg-white/85 p-4 sm:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-cocoa">Product images</p>
                  <p className="mt-1 text-xs leading-6 text-rosewood/70">
                    Upload product images directly. They are stored as image strings for this lightweight admin flow.
                  </p>
                </div>
                <label className="button-secondary cursor-pointer !py-2">
                  <ImagePlus className="h-4 w-4" />
                  {uploadingImages ? "Preparing..." : "Upload image"}
                  <input type="file" accept="image/*" multiple onChange={handleImageSelection} className="hidden" />
                </label>
              </div>

              {productImages.length ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {productImages.map((image, index) => (
                    <div key={`${image.slice(0, 24)}-${index}`} className="rounded-[1.25rem] bg-white/90 p-3 shadow-sm">
                      <img src={image} alt={`Product preview ${index + 1}`} className="h-28 w-full rounded-[1rem] object-cover" />
                      <button
                        type="button"
                        onClick={() => setProductImages((current) => current.filter((_, imageIndex) => imageIndex !== index))}
                        className="button-secondary mt-3 w-full !py-2"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-[1.25rem] bg-rosewater px-4 py-3 text-sm text-rosewood/75">
                  No product images selected yet.
                </div>
              )}
            </div>

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
            <button type="submit" disabled={savingProduct} className="button-primary sm:col-span-2">
              {savingProduct ? "Saving product..." : editingProduct ? "Update product" : "Add product"}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="glass-panel rounded-[2rem] border border-white/70 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rosewood/70">Inventory</p>
                <h2 className="mt-2 font-serif text-3xl text-cocoa">{data.products.length} products in dashboard</h2>
              </div>
              <span className="rounded-full bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-rosewood">
                Live catalogue
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
                        <button
                          type="button"
                          onClick={() => setEditingProduct(product)}
                          className="button-secondary !py-2"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteProduct(product._id)}
                          disabled={activeDeleteId === product._id}
                          className="button-secondary !py-2"
                        >
                          {activeDeleteId === product._id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] border border-white/70 p-6">
            <div className="flex items-center justify-between gap-4">
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
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-cocoa">Order #{order._id.slice(-6).toUpperCase()}</p>
                      <p className="mt-1 text-sm text-rosewood/70">
                        {order.customerName} • {formatCurrency(order.total)} • {formatDate(order.createdAt)}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.24em] text-rosewood/55">
                        {order.itemCount} items
                      </p>
                    </div>
                    <select
                      value={order.status}
                      disabled={activeOrderId === order._id}
                      onChange={(event) => void updateOrderStatus(order._id, event.target.value)}
                      className="rounded-full border bg-white px-4 py-2 text-sm"
                    >
                      {orderStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  {order.customizationDetails &&
                  (order.customizationDetails.giftMessage ||
                    order.customizationDetails.nameCustomization ||
                    order.customizationDetails.specialInstructions) ? (
                    <div className="mt-4 grid gap-3 rounded-[1.25rem] bg-rosewater/80 p-4 text-sm text-rosewood/85">
                      {order.customizationDetails.giftMessage ? (
                        <p>
                          <span className="font-semibold text-cocoa">Gift message:</span> {order.customizationDetails.giftMessage}
                        </p>
                      ) : null}
                      {order.customizationDetails.nameCustomization ? (
                        <p>
                          <span className="font-semibold text-cocoa">Name customization:</span>{" "}
                          {order.customizationDetails.nameCustomization}
                        </p>
                      ) : null}
                      {order.customizationDetails.specialInstructions ? (
                        <p>
                          <span className="font-semibold text-cocoa">Special instructions:</span>{" "}
                          {order.customizationDetails.specialInstructions}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
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
            <button type="submit" disabled={savingCoupon} className="button-primary sm:col-span-2">
              {savingCoupon ? "Saving coupon..." : "Save coupon"}
            </button>
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
                <button type="button" onClick={() => void deleteCoupon(coupon._id)} className="button-secondary mt-4 w-full !py-2">
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
