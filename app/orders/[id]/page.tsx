import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/server/auth";
import { getOrderByIdForUser } from "@/lib/server/storefront";
import { formatCurrency, formatDate } from "@/lib/utils";

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

  return (
    <div className="section-shell grid gap-8 py-12 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="glass-panel rounded-[2rem] p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rosewood/70">Order tracking</p>
        <h1 className="mt-3 font-serif text-4xl text-cocoa">Order #{order._id.slice(-6).toUpperCase()}</h1>
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
            <span>{order.status}</span>
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
    </div>
  );
}
