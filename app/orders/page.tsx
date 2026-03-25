import Link from "next/link";
import { redirect } from "next/navigation";

import { EmptyState } from "@/components/shared/empty-state";
import { getCurrentUser } from "@/lib/server/auth";
import { getUserOrders } from "@/lib/server/storefront";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/orders");
  }

  const orders = await getUserOrders(user._id);

  if (!orders.length) {
    return (
      <div className="section-shell py-16">
        <EmptyState title="No orders yet" description="Your future orders and tracking updates will appear here." />
      </div>
    );
  }

  return (
    <div className="section-shell py-12">
      <div className="space-y-5">
        {orders.map((order) => (
          <Link key={order._id} href={`/orders/${order._id}`} className="glass-panel block rounded-[2rem] p-6 transition hover:-translate-y-1">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rosewood/70">
                  Order #{order._id.slice(-6).toUpperCase()}
                </p>
                <h2 className="mt-3 font-serif text-3xl text-cocoa">{order.status.replaceAll("_", " ")}</h2>
                <p className="mt-2 text-sm text-rosewood/75">{formatDate(order.createdAt)}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-cocoa">{formatCurrency(order.total)}</p>
                <p className="text-sm text-rosewood/70">{order.items.length} line items</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
