import type { CouponType, ProductType } from "@/types";

type CouponLike = {
  code: string;
  type: CouponType;
  value: number;
  maxDiscount?: number | null;
  minOrderValue?: number | null;
  applicableCategories?: string[] | null;
  autoApply?: boolean;
  isActive?: boolean;
  startsAt?: string | Date | null;
  expiresAt?: string | Date | null;
};

export function isCouponCurrentlyActive(coupon: CouponLike | null, now = new Date()) {
  if (!coupon) {
    return false;
  }

  if (coupon.isActive === false) {
    return false;
  }

  if (coupon.startsAt && new Date(coupon.startsAt) > now) {
    return false;
  }

  if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
    return false;
  }

  return true;
}

export function getProductEffectivePrice(product: Pick<ProductType, "price" | "flashSale">) {
  const flashSale = product.flashSale;
  if (flashSale?.isActive && new Date(flashSale.endsAt) > new Date()) {
    return flashSale.price;
  }
  return product.price;
}

export function computeCouponDiscount(
  subtotal: number,
  categories: string[],
  coupon: CouponLike | null
) {
  if (!coupon) {
    return 0;
  }

  if (!isCouponCurrentlyActive(coupon)) {
    return 0;
  }

  if ((coupon.minOrderValue ?? 0) > subtotal) {
    return 0;
  }

  if (coupon.applicableCategories?.length) {
    const hasEligibleCategory = categories.some((category) =>
      coupon.applicableCategories?.includes(category)
    );
    if (!hasEligibleCategory) {
      return 0;
    }
  }

  if (coupon.type === "percentage") {
    const raw = Math.round((subtotal * coupon.value) / 100);
    return Math.min(raw, coupon.maxDiscount ?? raw);
  }

  return Math.min(coupon.value, subtotal);
}

export function pickBestCoupon(
  subtotal: number,
  categories: string[],
  coupons: CouponLike[]
) {
  return coupons.reduce<{ coupon: CouponLike | null; discount: number }>(
    (best, coupon) => {
      const discount = computeCouponDiscount(subtotal, categories, coupon);
      if (discount > best.discount) {
        return { coupon, discount };
      }
      return best;
    },
    { coupon: null, discount: 0 }
  );
}

export function calculateShipping(subtotal: number) {
  return subtotal >= 1999 ? 0 : 149;
}

export function buildPricingSummary({
  subtotal,
  discount
}: {
  subtotal: number;
  discount: number;
}) {
  const shippingFee = calculateShipping(subtotal - discount);
  const total = Math.max(subtotal - discount + shippingFee, 0);
  return {
    subtotal,
    discount,
    shippingFee,
    total
  };
}
