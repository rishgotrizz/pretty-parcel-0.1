"use client";

import { X } from "lucide-react";

import { formatCurrency, formatDate } from "@/lib/utils";

export type AdminOrderRow = {
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
};

export function OrderDetailsModal({
  order,
  onClose
}: {
  order: AdminOrderRow | null;
  onClose: () => void;
}) {
  if (!order) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-cocoa/35 px-4 py-6" onClick={onClose}>
      <div
        className="glass-panel max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rosewood/65">Order details</p>
            <h3 className="mt-2 font-serif text-3xl text-cocoa">Order #{order._id.slice(-6).toUpperCase()}</h3>
            <p className="mt-2 text-sm text-rosewood/75">{formatDate(order.createdAt)}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-white/85 p-2 text-rosewood">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-[1.5rem] bg-white/85 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rosewood/60">Customer</p>
            <div className="mt-3 space-y-2 text-sm text-rosewood/85">
              <p><span className="font-semibold text-cocoa">Name:</span> {order.customerName}</p>
              <p><span className="font-semibold text-cocoa">Email:</span> {order.customerEmail || "Not provided"}</p>
              <p><span className="font-semibold text-cocoa">Phone:</span> {order.shippingAddress?.phone || "Not provided"}</p>
            </div>
          </div>
          <div className="rounded-[1.5rem] bg-white/85 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rosewood/60">Order summary</p>
            <div className="mt-3 space-y-2 text-sm text-rosewood/85">
              <p><span className="font-semibold text-cocoa">Status:</span> {order.status.replaceAll("_", " ")}</p>
              <p><span className="font-semibold text-cocoa">Payment:</span> {order.paymentStatus}</p>
              <p><span className="font-semibold text-cocoa">Total:</span> {formatCurrency(order.total)}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-[1.5rem] bg-white/85 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rosewood/60">Shipping address</p>
            <div className="mt-3 space-y-2 text-sm text-rosewood/85">
              <p>{order.shippingAddress?.line1 || "No address provided"}</p>
              {order.shippingAddress?.line2 ? <p>{order.shippingAddress.line2}</p> : null}
              <p>
                {[order.shippingAddress?.city, order.shippingAddress?.state, order.shippingAddress?.postalCode]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              <p>{order.shippingAddress?.country || "India"}</p>
            </div>
          </div>
          <div className="rounded-[1.5rem] bg-rosewater/90 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rosewood/60">Customization</p>
            <div className="mt-3 space-y-2 text-sm text-rosewood/85">
              <p>
                <span className="font-semibold text-cocoa">Gift message:</span>{" "}
                {order.customizationDetails?.giftMessage || "No gift message"}
              </p>
              <p>
                <span className="font-semibold text-cocoa">Name customization:</span>{" "}
                {order.customizationDetails?.nameCustomization || "No name customization"}
              </p>
              <p>
                <span className="font-semibold text-cocoa">Special instructions:</span>{" "}
                {order.customizationDetails?.specialInstructions || "No special instructions"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-[1.5rem] bg-white/85 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rosewood/60">Items</p>
          <div className="mt-3 space-y-3">
            {order.items.map((item) => (
              <div key={`${item.slug}-${item.quantity}`} className="flex items-center justify-between rounded-[1rem] bg-rosewater/60 px-4 py-3 text-sm">
                <div>
                  <p className="font-semibold text-cocoa">{item.name}</p>
                  <p className="text-rosewood/75">Qty {item.quantity}</p>
                </div>
                <p className="font-semibold text-cocoa">{formatCurrency(item.unitPrice * item.quantity)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
