import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/server/auth";
import { getUserOrders } from "@/lib/server/storefront";
import { formatCustomerLevel, formatDate } from "@/lib/utils";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/account");
  }

  const orders = await getUserOrders(user._id);

  return (
    <div className="section-shell grid gap-8 py-12 lg:grid-cols-[0.85fr_1.15fr]">
      <div className="glass-panel rounded-[2rem] p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rosewood/70">Profile</p>
        <h1 className="mt-3 font-serif text-4xl text-cocoa">{user.name}</h1>
        <p className="mt-2 text-sm text-rosewood/70">{user.email}</p>
        <div className="mt-4 inline-flex rounded-full bg-rosewater px-4 py-2 text-sm font-semibold text-rosewood">
          {formatCustomerLevel(user.level ?? 1)} 💖
        </div>
        <div className="mt-6 rounded-[1.5rem] bg-white/80 p-4 text-sm text-rosewood/80">
          Wishlist items saved: <span className="font-semibold text-cocoa">{user.wishlist?.length ?? 0}</span>
        </div>
        <div className="mt-4 rounded-[1.5rem] bg-white/80 p-4 text-sm text-rosewood/80">
          Orders placed: <span className="font-semibold text-cocoa">{orders.length}</span>
        </div>
      </div>

      <div className="glass-panel rounded-[2rem] p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rosewood/70">Recent orders</p>
        <div className="mt-6 space-y-4">
          {orders.slice(0, 4).map((order) => (
            <div key={order._id} className="rounded-[1.5rem] bg-white/80 p-4">
              <p className="font-semibold text-cocoa">Order #{order._id.slice(-6).toUpperCase()}</p>
              <p className="mt-1 text-sm text-rosewood/70">{formatDate(order.createdAt)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
