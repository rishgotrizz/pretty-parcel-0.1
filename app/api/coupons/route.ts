import { Coupon } from "@/lib/models/Coupon";
import { connectToDatabase } from "@/lib/server/db";
import { isCouponCurrentlyActive } from "@/lib/server/pricing";
import { getSettings } from "@/lib/server/settings";

export async function GET() {
  await connectToDatabase();
  const settings = await getSettings();
  const coupons = await Coupon.find({
    isActive: true,
    source: { $ne: "notification_reward" },
    ...(settings.notificationRewardCode ? { code: { $ne: settings.notificationRewardCode } } : {})
  }).sort({ createdAt: -1 }).lean<any[]>();
  const validCoupons = coupons.filter((coupon) => isCouponCurrentlyActive(coupon) && !coupon.issuedToUsers?.length);

  return Response.json({
    coupons: validCoupons.map((coupon) => ({
      _id: coupon._id.toString(),
      code: coupon.code,
      description: coupon.description ?? "",
      type: coupon.type,
      value: coupon.value,
      minOrderValue: coupon.minOrderValue ?? 0,
      autoApply: coupon.autoApply
    }))
  });
}
