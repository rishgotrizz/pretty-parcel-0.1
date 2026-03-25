import { Coupon } from "@/lib/models/Coupon";
import { requireUser } from "@/lib/server/auth";
import { connectToDatabase } from "@/lib/server/db";
import { computeCouponDiscount, isCouponCurrentlyActive } from "@/lib/server/pricing";
import { getUserCart } from "@/lib/server/storefront";

export async function GET(request: Request) {
  const user = await requireUser();
  if (user instanceof Response) {
    return Response.json({ error: "Login required." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  if (!code) {
    return Response.json({ error: "Coupon code required." }, { status: 400 });
  }

  await connectToDatabase();
  const cart = await getUserCart(user._id);
  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true }).lean<any>();
  if (!coupon) {
    return Response.json({ valid: false, error: "Coupon not found." }, { status: 404 });
  }
  if (!isCouponCurrentlyActive(coupon as any)) {
    return Response.json({ valid: false, error: "Coupon is not active right now." }, { status: 400 });
  }

  const categories = cart.items.map((item) => (item.product as { category?: string })?.category ?? "");
  const discount = computeCouponDiscount(cart.summary.subtotal, categories, coupon as any);

  return Response.json({
    valid: discount > 0,
    discount,
    coupon: {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      autoApply: coupon.autoApply
    }
  });
}
