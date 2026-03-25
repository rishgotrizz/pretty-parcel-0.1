import { AnalyticsEvent } from "@/lib/models/AnalyticsEvent";
import { Cart } from "@/lib/models/Cart";
import { Product } from "@/lib/models/Product";
import { User } from "@/lib/models/User";
import { connectToDatabase } from "@/lib/server/db";

export async function getRecommendationsForUser(userId?: string | null) {
  await connectToDatabase();

  const fallback = await Product.find({ isActive: true })
    .sort({ isFeatured: -1, popularity: -1 })
    .limit(4)
    .lean();

  if (!userId) {
    return fallback;
  }

  const user = await User.findById(userId).lean<any>();
  const cart = await Cart.findOne({ user: userId }).populate("items.product").lean<any>();
  const recentEvents = await AnalyticsEvent.find({
    user: userId,
    eventType: { $in: ["page_view", "wishlist", "cart"] }
  })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean<any[]>();

  const categories = new Set<string>();
  user?.preferences?.favoriteCategories?.forEach((category: string) => categories.add(category));

  cart?.items.forEach((item: { product?: { category?: string } }) => {
    if (item.product?.category) {
      categories.add(item.product.category);
    }
  });

  recentEvents.forEach((event: any) => {
    const category = typeof event.metadata?.category === "string" ? event.metadata.category : null;
    if (category) {
      categories.add(category);
    }
  });

  if (!categories.size) {
    return fallback;
  }

  const results = await Product.find({
    isActive: true,
    category: { $in: [...categories] }
  })
    .sort({ popularity: -1, isFeatured: -1 })
    .limit(6)
    .lean();

  return results.length ? results : fallback;
}
