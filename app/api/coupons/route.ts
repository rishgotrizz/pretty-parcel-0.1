import { Coupon } from "@/lib/models/Coupon";
import { connectToDatabase } from "@/lib/server/db";
import { isCouponCurrentlyActive } from "@/lib/server/pricing";

export async function GET() {
  await connectToDatabase();
  const coupons = await Coupon.find({ isActive: true }).sort({ createdAt: -1 }).lean<any[]>();
  const validCoupons = coupons.filter((coupon) => isCouponCurrentlyActive(coupon));

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
