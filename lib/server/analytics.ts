import { Cart } from "@/lib/models/Cart";
import { AnalyticsEvent } from "@/lib/models/AnalyticsEvent";
import { Order } from "@/lib/models/Order";
import { Product } from "@/lib/models/Product";
import { User } from "@/lib/models/User";
import { connectToDatabase } from "@/lib/server/db";

export async function buildAdminAnalytics() {
  await connectToDatabase();

  const [orders, events, carts, totalUsers, totalProducts, totalOrders, newUsers, activeUsers, notificationSubscribers] = await Promise.all([
    Order.find().sort({ createdAt: -1 }).lean(),
    AnalyticsEvent.find().sort({ createdAt: -1 }).limit(500).lean(),
    Cart.find().lean(),
    User.countDocuments({ role: "customer" }),
    Product.countDocuments(),
    Order.countDocuments(),
    User.countDocuments({
      role: "customer",
      createdAt: {
        $gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)
      }
    }),
    User.countDocuments({
      role: "customer",
      lastLogin: {
        $gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)
      }
    }),
    User.countDocuments({ notificationPermission: "granted" })
  ]);

  const completedStatuses = ["paid", "processing", "shipped", "out_for_delivery", "delivered"];
  const paidOrders = (orders as any[]).filter((order) =>
    ["paid", "processing", "shipped", "delivered"].includes(order.status)
  );
  const completedOrders = (orders as any[]).filter((order) => completedStatuses.includes(order.status));
  const totalRevenue = paidOrders.reduce((sum: number, order: any) => sum + order.total, 0);
  const averageOrderValue = paidOrders.length ? Math.round(totalRevenue / paidOrders.length) : 0;
  const now = Date.now();
  const oneDay = 1000 * 60 * 60 * 24;
  const repeatCustomerIds = new Set(
    Object.entries(
      completedOrders.reduce<Record<string, number>>((acc, order) => {
        const key = order.user.toString();
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {})
    )
      .filter(([, count]) => count > 1)
      .map(([userId]) => userId)
  );

  const dailyRevenueValue = paidOrders
    .filter((order: any) => now - new Date(order.createdAt).getTime() <= oneDay)
    .reduce((sum: number, order: any) => sum + order.total, 0);

  const weeklyRevenueValue = paidOrders
    .filter((order: any) => now - new Date(order.createdAt).getTime() <= oneDay * 7)
    .reduce((sum: number, order: any) => sum + order.total, 0);

  const monthlyRevenueValue = paidOrders
    .filter((order: any) => now - new Date(order.createdAt).getTime() <= oneDay * 30)
    .reduce((sum: number, order: any) => sum + order.total, 0);

  const dailyRevenue = new Map<string, number>();
  paidOrders.forEach((order: any) => {
    const key = new Date(order.createdAt).toISOString().slice(0, 10);
    dailyRevenue.set(key, (dailyRevenue.get(key) ?? 0) + order.total);
  });

  const pageViews = (events as any[]).filter((event) => event.eventType === "page_view").length;
  const clickEvents = (events as any[]).filter((event) => event.eventType === "click").length;
  const cartEvents = (events as any[]).filter((event) => event.eventType === "cart").length;
  const wishlistEvents = (events as any[]).filter((event) => event.eventType === "wishlist").length;

  const abandonedCarts = (carts as any[]).filter((cart) => {
    const hasItems = cart.items.length > 0;
    const updatedAt = new Date(cart.updatedAt).getTime();
    const orderedAfter = paidOrders.some(
      (order: any) => order.user.toString() === cart.user.toString() && new Date(order.createdAt).getTime() > updatedAt
    );
    return hasItems && !orderedAfter && Date.now() - updatedAt > 1000 * 60 * 60 * 6;
  }).length;

  return {
    summary: {
      totalRevenue,
      totalUsers,
      newUsers,
      activeUsers,
      repeatCustomers: repeatCustomerIds.size,
      notificationSubscribers,
      totalOrders,
      totalProducts,
      paidOrders: paidOrders.length,
      averageOrderValue,
      dailyRevenue: dailyRevenueValue,
      weeklyRevenue: weeklyRevenueValue,
      monthlyRevenue: monthlyRevenueValue,
      pageViews,
      clickEvents,
      cartEvents,
      wishlistEvents,
      abandonedCarts
    },
    revenueTrend: [...dailyRevenue.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([date, revenue]) => ({ date, revenue })),
    topExitPages: Object.entries(
      (events as any[]).reduce<Record<string, number>>((acc, event) => {
        if (event.eventType === "time_spent" && event.durationMs && event.durationMs > 60000) {
          acc[event.path] = (acc[event.path] ?? 0) + 1;
        }
        return acc;
      }, {})
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([path, count]) => ({ path, count }))
  };
}
