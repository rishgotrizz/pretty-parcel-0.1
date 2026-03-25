"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { useToast } from "@/components/providers/toast-provider";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency } from "@/lib/utils";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, callback: (response: Record<string, string>) => void) => void;
    };
  }
}

type CheckoutCart = {
  items: Array<{ product: { name: string; images: string[]; slug: string; _id: string }; quantity: number; unitPrice: number }>;
  summary: { subtotal: number; discount: number; shippingFee: number; total: number };
  appliedCoupon?: { code: string; discount: number; description?: string; minOrderValue?: number } | null;
  availableCoupons?: Array<{ code: string; description?: string; minOrderValue?: number; type: string; value: number }>;
  error?: string;
};

export default function CheckoutPage() {
  const [cart, setCart] = useState<CheckoutCart | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const { pushToast } = useToast();

  async function readJson(response: Response) {
    try {
      const raw = await response.text();
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      console.error("[CheckoutPage] invalid API response", error);
      return {};
    }
  }

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  async function applyCoupon(code: string) {
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode || applyingCoupon) {
      return;
    }

    try {
      setApplyingCoupon(true);
      const response = await fetch(`/api/coupons/validate?code=${encodeURIComponent(normalizedCode)}`, {
        credentials: "include",
        headers: { Accept: "application/json" }
      });
      const data = await readJson(response);

      if (!response.ok || !data.valid) {
        pushToast(data.error ?? "Coupon is not valid for this cart.", "error");
        return;
      }

      setCouponCode(normalizedCode);
      setCart((current) =>
        current
          ? {
              ...current,
              appliedCoupon: {
                code: data.coupon?.code ?? normalizedCode,
                discount: typeof data.discount === "number" ? data.discount : 0,
                description: data.coupon?.description ?? "",
                minOrderValue: data.coupon?.minOrderValue ?? 0
              }
            }
          : current
      );
      setMessage(`Coupon ${normalizedCode} will be applied at checkout.`);
      pushToast(`Coupon ${normalizedCode} applied for checkout.`, "success");
    } catch (error) {
      console.error("[CheckoutPage] coupon apply failed", error);
      pushToast("Could not apply coupon right now.", "error");
    } finally {
      setApplyingCoupon(false);
    }
  }

  useEffect(() => {
    async function loadCart() {
      try {
        const response = await fetch("/api/cart", {
          cache: "no-store",
          credentials: "include",
          headers: { Accept: "application/json" }
        });
        const data = await readJson(response);
        setCart(data);
        setCouponCode(typeof data.appliedCoupon?.code === "string" ? data.appliedCoupon.code : "");
      } catch (error) {
        console.error("[CheckoutPage] failed to load cart", error);
        setCart({
          items: [],
          summary: { subtotal: 0, discount: 0, shippingFee: 0, total: 0 },
          error: "We couldn't load your checkout details."
        });
      } finally {
        setLoading(false);
      }
    }

    void loadCart();
  }, []);

  async function handleCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");

      const formData = new FormData(event.currentTarget);
      const checkoutSessionId = crypto.randomUUID();

      console.debug("[CheckoutPage] starting checkout");

      const payload = {
        checkoutSessionId,
        couponCode,
        shippingAddress: {
          fullName: String(formData.get("fullName") ?? ""),
          email: String(formData.get("email") ?? ""),
          phone: String(formData.get("phone") ?? ""),
          city: String(formData.get("city") ?? ""),
          state: String(formData.get("state") ?? ""),
          postalCode: String(formData.get("postalCode") ?? ""),
          line1: String(formData.get("line1") ?? ""),
          line2: String(formData.get("line2") ?? "")
        },
        customizationDetails: {
          giftMessage: String(formData.get("giftMessage") ?? ""),
          nameCustomization: String(formData.get("nameCustomization") ?? ""),
          specialInstructions: String(formData.get("specialInstructions") ?? "")
        }
      };

      const checkoutResponse = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      });
      const checkoutRaw = await checkoutResponse.text();
      const checkoutData = checkoutRaw ? JSON.parse(checkoutRaw) : {};
      if (!checkoutResponse.ok) {
        setMessage(checkoutData.error ?? "Checkout failed.");
        pushToast(checkoutData.error ?? "Checkout failed.", "error");
        return;
      }

      const paymentResponse = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderId: checkoutData.order._id })
      });
      const paymentRaw = await paymentResponse.text();
      const paymentData = paymentRaw ? JSON.parse(paymentRaw) : {};
      if (!paymentResponse.ok) {
        setMessage(paymentData.error ?? "Unable to start payment.");
        pushToast(paymentData.error ?? "Unable to start payment.", "error");
        return;
      }

      if (paymentData.mock || !window.Razorpay) {
        const verifyResponse = await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          credentials: "include",
          body: JSON.stringify({
            orderId: checkoutData.order._id,
            razorpayOrderId: paymentData.razorpayOrderId ?? `mock_${checkoutData.order._id}`,
            razorpayPaymentId: `demo_${Date.now()}`,
            razorpaySignature: "mock_signature",
            mock: true
          })
        });
        const verifyRaw = await verifyResponse.text();
        const verifyData = verifyRaw ? JSON.parse(verifyRaw) : {};
        if (!verifyResponse.ok) {
          setMessage(verifyData.error ?? "Payment verification failed.");
          pushToast(verifyData.error ?? "Payment verification failed.", "error");
          return;
        }
        window.location.href = `/orders/${checkoutData.order._id}`;
        return;
      }

      const razorpay = new window.Razorpay({
        key: paymentData.key,
        amount: paymentData.amount,
        currency: "INR",
        name: "The Pretty Parcel",
        description: "Handmade gift checkout",
        order_id: paymentData.razorpayOrderId,
        prefill: {
          name: String(formData.get("fullName") ?? ""),
          email: String(formData.get("email") ?? ""),
          contact: String(formData.get("phone") ?? "")
        },
        handler: async (response: Record<string, string>) => {
          const verifyResponse = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            credentials: "include",
            body: JSON.stringify({
              orderId: checkoutData.order._id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            })
          });
          const verifyRaw = await verifyResponse.text();
          const verifyData = verifyRaw ? JSON.parse(verifyRaw) : {};
          if (!verifyResponse.ok) {
            setMessage(verifyData.error ?? "Payment verification failed.");
            pushToast(verifyData.error ?? "Payment verification failed.", "error");
            return;
          }
          window.location.href = `/orders/${checkoutData.order._id}`;
        },
        modal: {
          ondismiss: async () => {
            await fetch("/api/payments/fail", {
              method: "POST",
              headers: { "Content-Type": "application/json", Accept: "application/json" },
              credentials: "include",
              body: JSON.stringify({
                orderId: checkoutData.order._id,
                reason: "Payment popup was closed before completion."
              })
            });
            setMessage("Payment was cancelled. You can try again from checkout.");
            pushToast("Payment was cancelled. You can try again from checkout.", "info");
          }
        },
        theme: {
          color: "#8d5b69"
        }
      });

      razorpay.on("payment.failed", async (response: { error?: { description?: string } }) => {
        const description = response.error?.description || "Payment failed.";
        await fetch("/api/payments/fail", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          credentials: "include",
          body: JSON.stringify({
            orderId: checkoutData.order._id,
            reason: description
          })
        });
        setMessage(description || "Payment failed. Please try again.");
        pushToast(description || "Payment failed. Please try again.", "error");
      });

      razorpay.open();
    } catch (error) {
      console.error("[CheckoutPage] checkout failed", error);
      setMessage("We couldn't complete checkout right now. Please try again.");
      pushToast("We couldn't complete checkout right now. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="section-shell py-16 text-sm text-rosewood/70">Preparing checkout...</div>;
  }

  if (cart?.error) {
    return (
      <div className="section-shell py-16">
        <EmptyState
          title="Login required"
          description="Please login before proceeding to secure checkout."
          action={<Link href="/login?next=/checkout" className="button-primary">Login now</Link>}
        />
      </div>
    );
  }

  if (!cart?.items.length) {
    return (
      <div className="section-shell py-16">
        <EmptyState title="Your cart is empty" description="Add items before checking out." />
      </div>
    );
  }

  return (
    <div className="section-shell grid gap-8 py-12 lg:grid-cols-[1.1fr_0.9fr]">
      <form onSubmit={handleCheckout} className="glass-panel space-y-5 rounded-[2rem] p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rosewood/70">Shipping</p>
          <h1 className="mt-3 font-serif text-4xl text-cocoa">Secure checkout</h1>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ["fullName", "Full name"],
            ["email", "Email address"],
            ["phone", "Phone number"],
            ["city", "City"],
            ["state", "State"],
            ["postalCode", "PIN code"]
          ].map(([name, label]) => (
            <input
              key={name}
              name={name}
              required
              placeholder={label}
              className="rounded-[1rem] border bg-white/90 px-4 py-3 text-sm outline-none"
            />
          ))}
          <input
            name="line1"
            required
            placeholder="Address line 1"
            className="rounded-[1rem] border bg-white/90 px-4 py-3 text-sm outline-none sm:col-span-2"
          />
          <input
            name="line2"
            placeholder="Address line 2"
            className="rounded-[1rem] border bg-white/90 px-4 py-3 text-sm outline-none sm:col-span-2"
          />
        </div>
        <div className="rounded-[1.5rem] bg-white/75 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rosewood/65">Available coupons</p>
              <p className="mt-2 text-sm text-rosewood/75">
                Apply an offer now and the best eligible discount will be used when your order is created.
              </p>
            </div>
            {cart.appliedCoupon ? (
              <span className="rounded-full bg-pink-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-pink-700">
                Applied: {cart.appliedCoupon.code}
              </span>
            ) : null}
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={couponCode}
              onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
              placeholder="Enter coupon code"
              className="w-full rounded-[1rem] border border-pink-100 bg-white/90 px-4 py-3 text-sm outline-none"
            />
            <button
              type="button"
              onClick={() => void applyCoupon(couponCode)}
              disabled={!couponCode.trim() || applyingCoupon}
              className="button-secondary min-w-[10rem] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {applyingCoupon ? "Applying..." : "Apply coupon"}
            </button>
          </div>
        </div>
        {cart.availableCoupons?.length ? (
          <div className="rounded-[1.5rem] bg-white/75 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rosewood/65">Available offers</p>
            <div className="mt-4 space-y-3">
              {cart.availableCoupons.map((coupon) => (
                <div key={coupon.code} className="rounded-[1.25rem] bg-white/90 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-cocoa">{coupon.code}</p>
                      {coupon.description ? <p className="mt-2 text-sm text-rosewood/75">{coupon.description}</p> : null}
                      <p className="mt-2 text-xs text-rosewood/65">Valid on orders above {formatCurrency(coupon.minOrderValue ?? 0)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void applyCoupon(coupon.code)}
                      disabled={applyingCoupon}
                      className="button-secondary !py-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {applyingCoupon && couponCode === coupon.code ? "Applying..." : "Apply coupon"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        <div className="rounded-[1.5rem] bg-white/75 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rosewood/65">Customization details</p>
          <div className="mt-4 grid gap-4">
            <input
              name="nameCustomization"
              placeholder="Name customization"
              className="rounded-[1rem] border bg-white/90 px-4 py-3 text-sm outline-none"
            />
            <textarea
              name="giftMessage"
              placeholder="Gift message"
              className="min-h-24 rounded-[1rem] border bg-white/90 px-4 py-3 text-sm outline-none"
            />
            <textarea
              name="specialInstructions"
              placeholder="Special instructions for your order"
              className="min-h-24 rounded-[1rem] border bg-white/90 px-4 py-3 text-sm outline-none"
            />
          </div>
        </div>
        <button type="submit" disabled={submitting} className="button-primary w-full disabled:cursor-not-allowed disabled:opacity-60">
          {submitting ? "Processing..." : "Pay with Razorpay"}
        </button>
        <p className="text-xs text-rosewood/70">
          Supports test-mode UPI, cards, wallets, and net banking through Razorpay. If keys are missing, the app uses a
          safe mock payment flow for local preview.
        </p>
        {message ? <p className="text-sm font-medium text-rosewood">{message}</p> : null}
      </form>

      <aside className="glass-panel rounded-[2rem] p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rosewood/70">Order summary</p>
        <div className="mt-5 space-y-4">
          {cart.items.map((item) => (
            <div key={item.product._id} className="flex items-center gap-4 rounded-[1.5rem] bg-white/80 p-4">
              <img src={item.product.images[0]} alt={item.product.name} className="h-16 w-16 rounded-2xl object-cover" />
              <div className="flex-1">
                <p className="font-medium text-cocoa">{item.product.name}</p>
                <p className="text-sm text-rosewood/70">Qty {item.quantity}</p>
              </div>
              <p className="text-sm font-semibold text-cocoa">{formatCurrency(item.unitPrice * item.quantity)}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 space-y-3 border-t border-rosewood/10 pt-5 text-sm text-rosewood/80">
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
          <div className="flex items-center justify-between text-base font-semibold text-cocoa">
            <span>Total</span>
            <span>{formatCurrency(cart.summary.total)}</span>
          </div>
          {cart.appliedCoupon ? (
            <div className="rounded-[1.5rem] bg-rosewater p-4 text-xs text-rosewood">
              Best discount currently applied: <span className="font-semibold">{cart.appliedCoupon.code}</span>
              {cart.appliedCoupon.description ? <span className="block pt-2">{cart.appliedCoupon.description}</span> : null}
            </div>
          ) : null}
        </div>
        <p className="mt-4 text-xs leading-6 text-rosewood/65">
          Add gift notes, personalization names, or making instructions here so every parcel feels thoughtful and personal.
        </p>
      </aside>
    </div>
  );
}
