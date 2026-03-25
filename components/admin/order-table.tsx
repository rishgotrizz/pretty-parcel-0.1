"use client";

import { useState } from "react";

import { OrderDetailsModal, type AdminOrderRow } from "@/components/admin/order-details-modal";
import { formatCurrency, formatDate, formatOrderStatus } from "@/lib/utils";

const orderStatuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

function StatusBadge({ label, tone }: { label: string; tone: "rose" | "emerald" | "amber" | "slate" }) {
  const classes =
    tone === "emerald"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "amber"
        ? "bg-amber-50 text-amber-700"
        : tone === "slate"
          ? "bg-slate-100 text-slate-700"
          : "bg-rosewater text-rosewood";

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${classes}`}>{label}</span>;
}

function getPaymentTone(status: string) {
  if (status === "paid") {
    return "emerald" as const;
  }
  if (status === "failed") {
    return "amber" as const;
  }
  return "slate" as const;
}

function getOrderTone(status: string) {
  if (status === "delivered") {
    return "emerald" as const;
  }
  if (status === "cancelled") {
    return "amber" as const;
  }
  if (status === "confirmed") {
    return "emerald" as const;
  }
  return "rose" as const;
}

export function OrderTable({
  orders,
  activeOrderId,
  onStatusChange
}: {
  orders: AdminOrderRow[];
  activeOrderId: string;
  onStatusChange: (orderId: string, status: string) => void;
}) {
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderRow | null>(null);

  return (
    <>
      <section className="glass-panel rounded-[2rem] border border-white/70 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rosewood/70">Recent orders</p>
            <h2 className="mt-2 font-serif text-3xl text-cocoa">Order management</h2>
          </div>
          <span className="rounded-full bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-rosewood">
            {orders.length} recent orders
          </span>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-[980px] w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.24em] text-rosewood/60">
                <th className="px-3 py-2">Order ID</th>
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">Items</th>
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Payment</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id} className="rounded-[1.5rem] bg-white/90 shadow-sm">
                  <td className="rounded-l-[1.5rem] px-3 py-4 text-sm font-semibold text-cocoa">
                    #{order._id.slice(-6).toUpperCase()}
                  </td>
                  <td className="px-3 py-4 text-sm text-rosewood/85">
                    <p className="font-semibold text-cocoa">{order.customerName}</p>
                    <p className="mt-1 text-xs text-rosewood/65">{order.customerEmail || "No email"}</p>
                  </td>
                  <td className="px-3 py-4 text-sm text-rosewood/85">
                    <p>{order.items.slice(0, 2).map((item) => item.name).join(", ")}</p>
                    <p className="mt-1 text-xs text-rosewood/65">
                      {order.itemCount} items
                      {order.customizationDetails?.giftMessage || order.customizationDetails?.nameCustomization || order.customizationDetails?.specialInstructions
                        ? " • customization added"
                        : ""}
                    </p>
                  </td>
                  <td className="px-3 py-4 text-sm font-semibold text-cocoa">{formatCurrency(order.total)}</td>
                  <td className="px-3 py-4">
                    <StatusBadge label={formatOrderStatus(order.status)} tone={getOrderTone(order.status)} />
                  </td>
                  <td className="px-3 py-4">
                    <StatusBadge label={order.paymentStatus} tone={getPaymentTone(order.paymentStatus)} />
                  </td>
                  <td className="px-3 py-4 text-sm text-rosewood/80">{formatDate(order.createdAt)}</td>
                  <td className="rounded-r-[1.5rem] px-3 py-4">
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setSelectedOrder(order)} className="button-secondary !py-2">
                        View details
                      </button>
                      <select
                        value={order.status}
                        disabled={activeOrderId === order._id}
                        onChange={(event) => onStatusChange(order._id, event.target.value)}
                        className="rounded-full border border-pink-100 bg-white px-4 py-2 text-sm outline-none"
                      >
                        {orderStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </>
  );
}
