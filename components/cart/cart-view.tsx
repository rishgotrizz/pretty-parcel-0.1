"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { useToast } from "@/components/providers/toast-provider";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency } from "@/lib/utils";

type CartState = {
  items: Array<{
    product: { _id: string; name: string; slug: string; images: string[] };
    quantity: number;
    unitPrice: number;
  }>;
  summary: {
    subtotal: number;
    discount: number;
    shippingFee: number;
    total: number;
  };
  appliedCoupon?: { code: string; discount: number } | null;
  error?: string;
};

export function CartView() {
  const [cart, setCart] = useState<CartState | null>(null);
  const [shippingSettings, setShippingSettings] = useState({ shippingPrice: 149, freeShippingThreshold: 1999 });
  const [loading, setLoading] = useState(true);
  const [activeProductId, setActiveProductId] = useState("");
  const { pushToast } = useToast();

  function normalizeCart(data: Record<string, any>): CartState {
    return {
      items: Array.isArray(data?.items) ? data.items : [],
      summary: {
        subtotal: Number(data?.summary?.subtotal ?? 0),
        discount: Number(data?.summary?.discount ?? 0),
        shippingFee: Number(data?.summary?.shippingFee ?? 0),
        total: Number(data?.summary?.total ?? 0)
      },
      appliedCoupon: data?.appliedCoupon ?? null,
      error: typeof data?.error === "string" ? data.error : ""
    };
  }

  const loadCart = async () => {
    try {
      setLoading(true);
      console.debug("[CartView] loading cart");

      const response = await fetch("/api/cart", {
        cache: "no-store",
        credentials: "include"
      });
      const raw = await response.text();
      const data = raw ? JSON.parse(raw) : {};

      console.debug("[CartView] load response", {
        ok: response.ok,
        status: response.status
      });

      const normalizedCart = normalizeCart(data);
      setCart(normalizedCart);
      if (!normalizedCart.error) {
        window.dispatchEvent(new Event("pretty-parcel-cart-updated"));
      }
    } catch (error) {
      console.error("[CartView] load failed", error);
      setCart({
        items: [],
        summary: { subtotal: 0, discount: 0, shippingFee: 0, total: 0 },
        error: "We couldn't load your cart."
      });
      pushToast("We couldn't load your cart.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCart();

    fetch("/api/settings", {
      cache: "no-store",
      headers: { Accept: "application/json" }
    })
      .then(async (response) => {
        const raw = await response.text();
        return raw ? JSON.parse(raw) : {};
      })
      .then((data) => {
        const settings = data?.settings ?? data?.data?.settings ?? {};
        setShippingSettings({
          shippingPrice: Number(settings?.shippingPrice ?? 149),
          freeShippingThreshold: Number(settings?.freeShippingThreshold ?? 1999)
        });
      })
      .catch((error) => {
        console.error("[CartView] settings load failed", error);
      });
  }, []);

  const updateQuantity = async (productId: string, quantity: number) => {
    try {
      setActiveProductId(productId);
      console.debug("[CartView] update quantity", { productId, quantity });
      const response = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include",
        body: JSON.stringify({ productId, quantity })
      });

      const raw = await response.text();
      const data = raw ? JSON.parse(raw) : {};

      if (!response.ok) {
        console.error("[CartView] update failed", data);
        pushToast(data.error ?? "Could not update quantity.", "error");
      } else {
        pushToast("Cart updated.", "success");
      }
    } catch (error) {
      console.error("[CartView] update request failed", error);
      pushToast("Could not update quantity.", "error");
    } finally {
      setActiveProductId("");
      await loadCart();
    }
  };

  const removeItem = async (productId: string) => {
    try {
      setActiveProductId(productId);
      console.debug("[CartView] remove item", { productId });
      const response = await fetch("/api/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include",
        body: JSON.stringify({ productId })
      });

      const raw = await response.text();
      const data = raw ? JSON.parse(raw) : {};

      if (!response.ok) {
        console.error("[CartView] remove failed", data);
        pushToast(data.error ?? "Could not remove item.", "error");
      } else {
        pushToast("Item removed from cart.", "success");
      }
    } catch (error) {
      console.error("[CartView] remove request failed", error);
      pushToast("Could not remove item.", "error");
    } finally {
      setActiveProductId("");
      await loadCart();
    }
  };

  if (loading) {
    return <div className="section-shell py-16 text-sm text-rosewood/70">Loading your cart...</div>;
  }

  if (cart?.error) {
    return (
      <div className="section-shell py-16">
        <EmptyState
          title="Login to view your cart"
          description="Your persistent cart lives in your account so you can continue shopping from any device."
          action={<Link href="/login?next=/cart" className="button-primary">Login now</Link>}
        />
      </div>
    );
  }

  if (!cart?.items.length) {
    return (
      <div className="section-shell py-16">
        <EmptyState
          title="Your cart is empty"
          description="Add handmade gift items to build your order."
          action={<Link href="/products" className="button-primary">Browse products</Link>}
        />
      </div>
    );
  }

  const eligibleTotal = Math.max(cart.summary.subtotal - cart.summary.discount, 0);
  const remainingForFreeShipping = Math.max(shippingSettings.freeShippingThreshold - eligibleTotal, 0);
  const shippingBannerText =
    eligibleTotal >= shippingSettings.freeShippingThreshold
      ? "You unlocked FREE shipping!"
      : `Add ${formatCurrency(remainingForFreeShipping)} more to get FREE shipping`;

  return (
    <div className="section-shell grid gap-8 py-8 pb-28 sm:py-12 lg:grid-cols-[1.3fr_0.7fr] lg:pb-12">
      <div className="lg:col-span-2">
        <div className="group sticky top-[4.8rem] z-20 overflow-hidden rounded-[1.5rem] border border-pink-100/80 bg-gradient-to-r from-rosewater via-pink-50 to-white px-4 py-3 shadow-[var(--shadow-card)]">
          <div className="marquee-track whitespace-nowrap text-sm font-semibold text-pink-700 group-hover:[animation-play-state:paused]">
            <span className="mx-6 inline-block">🎁 Free shipping on orders above {formatCurrency(shippingSettings.freeShippingThreshold)}</span>
            <span className="mx-6 inline-block">{shippingBannerText}</span>
            <span className="mx-6 inline-block">Shipping today: {formatCurrency(shippingSettings.shippingPrice)}</span>
            <span className="mx-6 inline-block">🎁 Free shipping on orders above {formatCurrency(shippingSettings.freeShippingThreshold)}</span>
            <span className="mx-6 inline-block">{shippingBannerText}</span>
            <span className="mx-6 inline-block">Shipping today: {formatCurrency(shippingSettings.shippingPrice)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {cart.items.map((item) => (
          <div key={item?.product?._id ?? item?.product?.slug ?? `${item?.product?.name ?? "item"}-${item?.quantity ?? 1}`} className="glass-panel flex flex-col gap-4 rounded-[2rem] p-5 sm:flex-row">
            <img src={item?.product?.images?.[0] || "/hero-pretty-parcel.svg"} alt={item?.product?.name || "Cart item"} className="h-32 w-full rounded-[1.5rem] object-cover sm:w-32" />
            <div className="flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-serif text-2xl text-cocoa">{item?.product?.name || "Pretty Parcel Gift"}</h2>
                  <Link href={`/products/${item?.product?.slug || ""}`} className="text-sm font-medium text-berry">
                    View product
                  </Link>
                </div>
                <button
                  type="button"
                  disabled={activeProductId === item?.product?._id}
                  onClick={() => item?.product?._id ? void removeItem(item.product._id) : undefined}
                  className="rounded-full bg-white/80 p-3 text-rosewood"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="inline-flex items-center rounded-full border border-white/70 bg-white/90 p-2">
                  <button
                    type="button"
                    disabled={activeProductId === item?.product?._id}
                    onClick={() => item?.product?._id ? void updateQuantity(item.product._id, Math.max(1, (item?.quantity ?? 1) - 1)) : undefined}
                    className="rounded-full p-2"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="min-w-10 text-center text-sm font-semibold">{item?.quantity ?? 1}</span>
                  <button
                    type="button"
                    disabled={activeProductId === item?.product?._id}
                    onClick={() => item?.product?._id ? void updateQuantity(item.product._id, (item?.quantity ?? 1) + 1) : undefined}
                    className="rounded-full p-2"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-lg font-semibold text-cocoa">{formatCurrency((item?.unitPrice ?? 0) * (item?.quantity ?? 1))}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <aside className="glass-panel h-fit rounded-[2rem] p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rosewood/70">Order summary</p>
        <div className="mt-6 space-y-4 text-sm text-rosewood/80">
          <div className="flex items-center justify-between">
            <span>Subtotal</span>
            <span>{formatCurrency(cart.summary.subtotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Discount</span>
            <span>-{formatCurrency(cart.summary.discount)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Shipping</span>
            <span>{formatCurrency(cart.summary.shippingFee)}</span>
          </div>
          {cart.appliedCoupon ? (
            <div className="rounded-2xl bg-rosewater p-4 text-xs">
              Best offer applied: <span className="font-semibold">{cart.appliedCoupon.code}</span>
            </div>
          ) : null}
          <div className="flex items-center justify-between border-t border-rosewood/10 pt-4 text-base font-semibold text-cocoa">
            <span>Total</span>
            <span>{formatCurrency(cart.summary.total)}</span>
          </div>
        </div>
        <Link href="/checkout" className="button-primary mt-6 w-full">
          Continue to checkout
        </Link>
      </aside>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pb-4 lg:hidden">
        <div className="pointer-events-auto rounded-[1.5rem] border border-pink-100/80 bg-white/95 p-4 shadow-[var(--shadow-card)] backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rosewood/65">Cart total</p>
              <p className="mt-1 text-lg font-semibold text-cocoa">{formatCurrency(cart.summary.total)}</p>
            </div>
            <Link href="/checkout" className="button-primary !px-5 !py-3">
              Checkout
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
