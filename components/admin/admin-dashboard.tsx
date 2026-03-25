"use client";

import { AlertTriangle, BarChart3, MousePointerClick, Package, Percent, RefreshCcw, ShoppingBag, Sparkles, Trash2, Users } from "lucide-react";
import { useEffect, useState, type ComponentType, type FormEvent } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { BrandingCustomization } from "@/components/admin/branding-customization";
import { OrderTable } from "@/components/admin/order-table";
import { ProductForm, type ProductFormFieldErrors, type ProductFormValues } from "@/components/admin/product-form";
import { ReviewsManager } from "@/components/admin/reviews-manager";
import { useToast } from "@/components/providers/toast-provider";
import { formatCurrency } from "@/lib/utils";

type ProductAdminItem = {
  _id: string;
  name: string;
  slug: string;
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
  isSpecial?: boolean;
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
      activeUsers: number;
      repeatCustomers: number;
      notificationSubscribers: number;
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
    customerEmail: string;
    paymentStatus: string;
    itemCount: number;
    items: Array<{ name: string; quantity: number; unitPrice: number; slug: string }>;
    shippingAddress: {
      fullName: string;
      email: string;
      phone: string;
      line1: string;
      line2: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    } | null;
    customizationDetails?: {
      giftMessage?: string;
      nameCustomization?: string;
      specialInstructions?: string;
    } | null;
  }>;
  coupons: Array<{ _id: string; code: string; description?: string; type: string; value: number; minOrderValue?: number; autoApply: boolean }>;
  marketing: {
    specialCategoryTitle: string;
  };
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

const blankProduct: ProductAdminItem = {
  _id: "",
  name: "",
  slug: "",
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
  isSpecial: false,
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

function toFormValues(product: ProductAdminItem | null): ProductFormValues {
  const value = product ?? blankProduct;
  return {
    id: value._id || undefined,
    name: value.name,
    slug: value.slug ?? "",
    category: value.category,
    shortDescription: value.shortDescription,
    description: value.description,
    price: value.price ? String(value.price) : "",
    compareAtPrice: value.compareAtPrice ? String(value.compareAtPrice) : "",
    stock: String(value.stock ?? 0),
    flashSalePrice: value.flashSalePrice ? String(value.flashSalePrice) : "",
    flashSaleEndsAt: value.flashSaleEndsAt ? value.flashSaleEndsAt.slice(0, 10) : "",
    tags: value.tags.join(", "),
    specifications: value.specifications.join("\n"),
    customisationNotes: value.customisationNotes ?? "",
    isFeatured: value.isFeatured,
    isSpecial: value.isSpecial ?? false,
    isActive: value.isActive,
    images: value.images ?? []
  };
}

export function AdminDashboard() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [message, setMessage] = useState("");
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [savingProduct, setSavingProduct] = useState(false);
  const [savingCoupon, setSavingCoupon] = useState(false);
  const [activeDeleteId, setActiveDeleteId] = useState("");
  const [activeOrderId, setActiveOrderId] = useState("");
  const [editingProduct, setEditingProduct] = useState<ProductAdminItem | null>(null);
  const [productFieldErrors, setProductFieldErrors] = useState<ProductFormFieldErrors>({});
  const [productResetSignal, setProductResetSignal] = useState(0);
  const [specialCategoryTitle, setSpecialCategoryTitle] = useState("Special Picks");
  const [marketingSaving, setMarketingSaving] = useState(false);
  const [notificationSending, setNotificationSending] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationAudience, setNotificationAudience] = useState("all");
  const [dangerZone, setDangerZone] = useState({
    deleteProducts: false,
    deleteOrders: false,
    deleteUsers: false,
    deleteCoupons: false
  });
  const [showDangerConfirm, setShowDangerConfirm] = useState(false);
  const [deletingSelectedData, setDeletingSelectedData] = useState(false);
  const { pushToast } = useToast();

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
      const [analyticsResponse, productsResponse, ordersResponse, couponsResponse, marketingResponse] = await Promise.all([
        fetch("/api/admin/analytics", { credentials: "include", headers: { Accept: "application/json" } }),
        fetch("/api/admin/products", { credentials: "include", headers: { Accept: "application/json" } }),
        fetch("/api/admin/orders", { credentials: "include", headers: { Accept: "application/json" } }),
        fetch("/api/admin/coupons", { credentials: "include", headers: { Accept: "application/json" } }),
        fetch("/api/admin/marketing", { credentials: "include", headers: { Accept: "application/json" } })
      ]);

      const [analytics, products, orders, coupons, marketing] = await Promise.all([
        readJson(analyticsResponse),
        readJson(productsResponse),
        readJson(ordersResponse),
        readJson(couponsResponse),
        readJson(marketingResponse)
      ]);

      setSpecialCategoryTitle(marketing.specialCategoryTitle ?? "Special Picks");
      setData({
        analytics,
        products: products.products ?? [],
        orders: orders.orders ?? [],
        coupons: coupons.coupons ?? [],
        marketing: {
          specialCategoryTitle: marketing.specialCategoryTitle ?? "Special Picks"
        }
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
    setProductFieldErrors({});
    setProductResetSignal((value) => value + 1);
  }

  async function saveProduct(values: ProductFormValues) {
    setProductFieldErrors({});

    try {
      setSavingProduct(true);
      const response = await fetch("/api/admin/products", {
        method: values.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: values.id,
          name: values.name,
          slug: values.slug,
          category: values.category,
          shortDescription: values.shortDescription,
          description: values.description,
          price: values.price,
          compareAtPrice: values.compareAtPrice,
          stock: values.stock,
          flashSalePrice: values.flashSalePrice,
          flashSaleEndsAt: values.flashSaleEndsAt,
          tags: values.tags,
          specifications: values.specifications,
          customisationNotes: values.customisationNotes,
          isFeatured: values.isFeatured,
          isSpecial: values.isSpecial,
          isActive: values.isActive,
          images: values.images
        })
      });
      const result = await readJson(response);

      if (!response.ok) {
        setProductFieldErrors(result.fieldErrors ?? {});
        setMessage(result.error ?? "Could not save product.");
        pushToast(result.error ?? "Could not save product.", "error");
        return;
      }

      if (result.product) {
        setData((current) =>
          current
            ? {
                ...current,
                products: values.id
                  ? current.products.map((product) => (product._id === result.product._id ? result.product : product))
                  : [result.product, ...current.products]
              }
            : current
        );
      }

      setMessage(values.id ? "Product updated successfully." : "Product added successfully.");
      pushToast(values.id ? "Product updated successfully." : "Product added successfully.", "success");
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

  async function saveMarketingSettings() {
    try {
      setMarketingSaving(true);
      const response = await fetch("/api/admin/marketing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include",
        body: JSON.stringify({ specialCategoryTitle })
      });
      const result = await readJson(response);
      if (!response.ok) {
        pushToast(result.error ?? "Could not save special category.", "error");
        return;
      }
      setData((current) => (current ? { ...current, marketing: { specialCategoryTitle: result.specialCategoryTitle } } : current));
      pushToast("Special category updated.", "success");
    } catch (error) {
      console.error("[AdminDashboard] marketing save failed", error);
      pushToast("Could not save special category.", "error");
    } finally {
      setMarketingSaving(false);
    }
  }

  async function sendNotification() {
    try {
      setNotificationSending(true);
      const response = await fetch("/api/admin/send-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: notificationMessage, audience: notificationAudience })
      });
      const result = await readJson(response);
      if (!response.ok) {
        pushToast(result.error ?? "Could not send notification.", "error");
        return;
      }
      setNotificationMessage("");
      pushToast(`Notification queued for ${result.recipients} users.`, "success");
    } catch (error) {
      console.error("[AdminDashboard] notification send failed", error);
      pushToast("Could not send notification.", "error");
    } finally {
      setNotificationSending(false);
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

  async function deleteSelectedData() {
    try {
      setDeletingSelectedData(true);
      console.log("[DangerZone] confirm deletion", dangerZone);

      const response = await fetch("/api/admin/delete-selected", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include",
        body: JSON.stringify(dangerZone)
      });
      const result = await readJson(response);

      if (!response.ok) {
        setMessage(result.error ?? "Could not delete selected data.");
        pushToast(result.error ?? "Could not delete selected data.", "error");
        return;
      }

      setDangerZone({
        deleteProducts: false,
        deleteOrders: false,
        deleteUsers: false,
        deleteCoupons: false
      });
      setShowDangerConfirm(false);
      clearProductForm();
      setMessage("Selected data deleted successfully.");
      pushToast("Selected data deleted successfully.", "success");
      await loadDashboard();
    } catch (error) {
      console.error("[DangerZone] deletion failed", error);
      setMessage("Could not delete selected data.");
      pushToast("Could not delete selected data.", "error");
    } finally {
      setDeletingSelectedData(false);
    }
  }

  if (loadingDashboard || !data) {
    return <div className="section-shell py-14 text-sm text-rosewood/70">Loading admin dashboard...</div>;
  }

  const selectedDangerItems = [
    dangerZone.deleteProducts ? "Products" : null,
    dangerZone.deleteOrders ? "Orders" : null,
    dangerZone.deleteUsers ? "Users except admin" : null,
    dangerZone.deleteCoupons ? "Coupons" : null
  ].filter(Boolean) as string[];

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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ProductMetricCard label="Active users" value={data.analytics.summary.activeUsers} icon={Users} />
        <ProductMetricCard label="Notification subscribers" value={data.analytics.summary.notificationSubscribers} icon={Sparkles} />
        <ProductMetricCard label="Repeat customers" value={data.analytics.summary.repeatCustomers} icon={RefreshCcw} />
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

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="glass-panel rounded-[2rem] border border-white/70 p-6">
          <ProductForm
            product={toFormValues(editingProduct)}
            fieldErrors={productFieldErrors}
            saving={savingProduct}
            resetSignal={productResetSignal}
            onCancelEdit={editingProduct ? clearProductForm : undefined}
            onSubmit={saveProduct}
          />
        </section>

        <section className="glass-panel rounded-[2rem] border border-white/70 p-6">
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
                        <p className="mt-1 text-xs text-rosewood/60">/{product.slug}</p>
                        <p className="mt-2 line-clamp-2 text-sm text-rosewood/75">{product.shortDescription}</p>
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
                        {product.isSpecial ? (
                          <span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-semibold text-pink-700">Special</span>
                        ) : null}
                        {product.isFeatured ? (
                          <span className="rounded-full bg-berry px-3 py-1 text-xs font-semibold text-white">Featured</span>
                        ) : null}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button type="button" onClick={() => {
                        setEditingProduct(product);
                        setProductFieldErrors({});
                      }} className="button-secondary !py-2">
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
        </section>
      </div>

      <OrderTable orders={data.orders} activeOrderId={activeOrderId} onStatusChange={(id, status) => void updateOrderStatus(id, status)} />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="glass-panel rounded-[2rem] border border-white/70 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rosewood/70">Special category</p>
          <h2 className="mt-2 font-serif text-3xl text-cocoa">Homepage merchandising</h2>
          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-cocoa">Section title</label>
              <input
                value={specialCategoryTitle}
                onChange={(event) => setSpecialCategoryTitle(event.target.value)}
                className="w-full rounded-[1rem] border border-pink-100 bg-white/90 px-4 py-3 text-sm outline-none"
                placeholder="Valentine Specials"
              />
            </div>
            <button type="button" disabled={marketingSaving} onClick={() => void saveMarketingSettings()} className="button-primary">
              {marketingSaving ? "Saving..." : "Save special category"}
            </button>
            <p className="text-xs leading-6 text-rosewood/70">
              This section appears on the homepage only when at least one product is marked as special.
            </p>
          </div>
        </div>

        <div className="glass-panel rounded-[2rem] border border-white/70 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rosewood/70">Create coupon</p>
          <form onSubmit={createCoupon} className="mt-6 grid gap-3 sm:grid-cols-2">
            <input name="code" required placeholder="Code" className="rounded-[1rem] border bg-white/90 px-4 py-3 text-sm" />
            <input name="description" placeholder="Description" className="rounded-[1rem] border bg-white/90 px-4 py-3 text-sm" />
            <select name="type" className="rounded-[1rem] border bg-white/90 px-4 py-3 text-sm">
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed</option>
            </select>
            <input name="value" required type="number" placeholder="Value" className="rounded-[1rem] border bg-white/90 px-4 py-3 text-sm" />
            <input name="minOrderValue" type="number" placeholder="Minimum order value" className="rounded-[1rem] border bg-white/90 px-4 py-3 text-sm" />
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
                    {coupon.description ? <p className="mt-2 text-xs text-rosewood/70">{coupon.description}</p> : null}
                    <p className="mt-2 text-sm text-rosewood/70">
                      {coupon.type} • {coupon.value} • above {formatCurrency(coupon.minOrderValue ?? 0)}
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

      <div className="glass-panel rounded-[2rem] border border-white/70 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rosewood/70">Send notifications</p>
        <h2 className="mt-2 font-serif text-3xl text-cocoa">Audience messaging</h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr_auto]">
          <textarea
            value={notificationMessage}
            onChange={(event) => setNotificationMessage(event.target.value)}
            placeholder="Tell shoppers about a flash sale, limited drop, or gift reminder..."
            className="min-h-24 rounded-[1rem] border border-pink-100 bg-white/90 px-4 py-3 text-sm outline-none"
          />
          <select
            value={notificationAudience}
            onChange={(event) => setNotificationAudience(event.target.value)}
            className="rounded-[1rem] border border-pink-100 bg-white/90 px-4 py-3 text-sm outline-none"
          >
            <option value="all">All users</option>
            <option value="frequentVisitors">Frequent visitors</option>
            <option value="customers">Customers</option>
            <option value="newUsers">New users</option>
          </select>
          <button
            type="button"
            onClick={() => void sendNotification()}
            disabled={!notificationMessage.trim() || notificationSending}
            className="button-primary h-fit"
          >
            {notificationSending ? "Sending..." : "Send notification"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <BrandingCustomization />
        <ReviewsManager />
      </div>

      <section className="rounded-[2rem] border border-rose-200 bg-gradient-to-br from-rose-50/95 via-white to-rose-100/90 p-6 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] text-rose-700">
              <AlertTriangle className="h-4 w-4" />
              Danger Zone
            </div>
            <h2 className="mt-4 font-serif text-3xl text-rose-900">Delete selected data safely</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-rose-800/80">
              Select exactly what you want to remove. This action is destructive, double-confirmed, and logged to the console for safety.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowDangerConfirm(true)}
            disabled={!selectedDangerItems.length || deletingSelectedData}
            className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-full border border-rose-300 bg-rose-600 px-5 py-3 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            {deletingSelectedData ? "Deleting..." : "Delete Selected Data"}
          </button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            { key: "deleteProducts", label: "Delete all products" },
            { key: "deleteOrders", label: "Delete all orders" },
            { key: "deleteUsers", label: "Delete all users (except admin)" },
            { key: "deleteCoupons", label: "Delete coupons" }
          ].map((item) => {
            const checked = dangerZone[item.key as keyof typeof dangerZone];
            return (
              <label
                key={item.key}
                className={`flex cursor-pointer items-center gap-3 rounded-[1.5rem] border px-4 py-4 text-sm font-medium transition ${
                  checked
                    ? "border-rose-300 bg-rose-100/90 text-rose-900 shadow-sm"
                    : "border-rose-200 bg-white/80 text-rose-800/80"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) =>
                    setDangerZone((current) => ({
                      ...current,
                      [item.key]: event.target.checked
                    }))
                  }
                  className="h-4 w-4 accent-rose-600"
                />
                <span>{item.label}</span>
              </label>
            );
          })}
        </div>
      </section>

      {showDangerConfirm ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-cocoa/45 px-4 py-6" onClick={() => setShowDangerConfirm(false)}>
          <div
            className="glass-panel w-full max-w-xl rounded-[2rem] border border-rose-200 p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-700/80">Confirm deletion</p>
                <h3 className="mt-2 font-serif text-3xl text-rose-900">Are you sure you want to delete selected data?</h3>
                <p className="mt-3 text-sm leading-7 text-rose-800/80">
                  This action cannot be undone. Selected data groups will be permanently removed.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-[1.5rem] bg-rose-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-700/80">Selected items</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedDangerItems.map((item) => (
                  <span key={item} className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-rose-900 shadow-sm">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button type="button" onClick={() => setShowDangerConfirm(false)} className="button-secondary">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void deleteSelectedData()}
                disabled={deletingSelectedData}
                className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                {deletingSelectedData ? "Deleting..." : "Confirm deletion"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
