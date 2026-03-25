import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/server/auth";
import { getOrderByIdForUser } from "@/lib/server/storefront";
import { formatCurrency, formatDate, formatOrderStatus, normalizeOrderStatus } from "@/lib/utils";

export default async function OrderDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const order = await getOrderByIdForUser(id, user._id, user.role === "admin");
  if (!order) {
    notFound();
  }

  const orderStatus = normalizeOrderStatus(order.status);
  const statusSteps = ["pending", "confirmed", "shipped", "delivered"];
  const activeStepIndex = statusSteps.indexOf(orderStatus);

  return (
    <div className="section-shell grid gap-8 py-12 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="glass-panel rounded-[2rem] p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rosewood/70">Order tracking</p>
        <h1 className="mt-3 font-serif text-4xl text-cocoa">Order #{order._id.slice(-6).toUpperCase()}</h1>
        <div className="mt-6 rounded-[1.5rem] bg-white/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rosewood/60">Current status</p>
          <p className="mt-2 text-lg font-semibold capitalize text-cocoa">{formatOrderStatus(orderStatus)}</p>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {statusSteps.map((step, index) => (
              <div key={step} className="space-y-2">
                <div className={`h-2 rounded-full ${index <= activeStepIndex ? "bg-pink-500" : "bg-pink-100"}`} />
                <p className={`text-[11px] uppercase tracking-[0.18em] ${index <= activeStepIndex ? "text-pink-700" : "text-rosewood/45"}`}>
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-8 space-y-4">
          {order.tracking?.timeline?.map((event: { status: string; label: string; at: string | Date }) => (
            <div key={`${event.status}-${event.at}`} className="rounded-[1.5rem] bg-white/80 p-4">
              <p className="font-semibold text-cocoa">{event.label}</p>
              <p className="mt-1 text-sm text-rosewood/70">{formatDate(event.at)}</p>
            </div>
          )) ?? <p className="text-sm text-rosewood/70">Tracking updates will appear here after payment confirmation.</p>}
        </div>
      </div>

      <aside className="glass-panel rounded-[2rem] p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rosewood/70">Invoice</p>
        <div className="mt-5 space-y-3 text-sm text-rosewood/80">
          <div className="flex items-center justify-between">
            <span>Invoice no.</span>
            <span>{order.payment?.invoiceNumber ?? "Pending"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Status</span>
            <span className="capitalize">{formatOrderStatus(orderStatus)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Order date</span>
            <span>{formatDate(order.createdAt)}</span>
          </div>
          <div className="border-t border-rosewood/10 pt-4">
            {order.items.map((item: { slug: string; quantity: number; name: string; unitPrice: number }) => (
              <div key={`${item.slug}-${item.quantity}`} className="flex items-center justify-between py-2">
                <span>
                  {item.name} x {item.quantity}
                </span>
                <span>{formatCurrency(item.unitPrice * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span>Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Discount</span>
            <span>-{formatCurrency(order.discount)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Shipping</span>
            <span>{formatCurrency(order.shippingFee)}</span>
          </div>
          <div className="flex items-center justify-between text-base font-semibold text-cocoa">
            <span>Total</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
        </div>
        {order.customizationDetails &&
        (order.customizationDetails.giftMessage ||
          order.customizationDetails.nameCustomization ||
          order.customizationDetails.specialInstructions) ? (
          <div className="mt-6 rounded-[1.5rem] bg-rosewater/80 p-4 text-sm text-rosewood/85">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-rosewood/60">Customization details</p>
            <div className="mt-3 space-y-2">
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
          </div>
        ) : null}
        <Link href="/products" className="button-secondary mt-6 w-full">
          Continue shopping
        </Link>
      </aside>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pb-4 sm:hidden">
        <div className="pointer-events-auto rounded-[1.5rem] border border-pink-100/80 bg-white/95 p-4 shadow-[var(--shadow-card)] backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rosewood/65">Order status</p>
              <p className="mt-1 text-sm font-semibold capitalize text-cocoa">{formatOrderStatus(orderStatus)}</p>
            </div>
            <Link href="/products" className="button-primary !px-5 !py-3">
              Shop more
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
