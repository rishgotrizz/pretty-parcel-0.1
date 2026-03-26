import { z } from "zod";

import { Coupon } from "@/lib/models/Coupon";
import { apiError, apiSuccess, isDuplicateKeyError, logApiError, parseJsonBody } from "@/lib/server/api";
import { requireAdmin } from "@/lib/server/auth";
import { connectToDatabase } from "@/lib/server/db";
import { getSettings, updateSettings } from "@/lib/server/settings";

const campaignSchema = z.object({
  enableNotification: z.boolean(),
  couponCode: z.string().trim().max(40).optional().or(z.literal("")),
  discountType: z.enum(["percentage", "flat"]),
  discountValue: z.coerce.number().min(0),
  minOrderValue: z.coerce.number().min(0)
});

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof Response) {
    return apiError("Forbidden", 403);
  }

  const settings = await getSettings();
  return apiSuccess({
    enableNotification: settings.enableNotification,
    couponCode: settings.couponCode,
    discountType: settings.discountType,
    discountValue: settings.discountValue,
    minOrderValue: settings.minOrderValue
  });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof Response) {
    return apiError("Forbidden", 403);
  }

  try {
    const parsed = campaignSchema.safeParse(await parseJsonBody(request));
    if (!parsed.success) {
      return apiError("Please provide valid coupon and notification settings.", 400);
    }

    const previousSettings = await getSettings();
    const couponCode = parsed.data.couponCode?.trim().toUpperCase() ?? "";

    if (couponCode && parsed.data.discountValue <= 0) {
      return apiError("Discount value must be greater than 0 when coupon code is set.", 400);
    }

    await connectToDatabase();

    if (previousSettings.couponCode && previousSettings.couponCode !== couponCode) {
      await Coupon.findOneAndUpdate(
        { code: previousSettings.couponCode },
        { $set: { isActive: false, autoApply: false } }
      );
    }

    if (couponCode) {
      await Coupon.findOneAndUpdate(
        { code: couponCode },
        {
          $set: {
            code: couponCode,
            description: "Notification subscriber reward",
            type: parsed.data.discountType === "flat" ? "fixed" : "percentage",
            value: parsed.data.discountValue,
            minOrderValue: parsed.data.minOrderValue,
            isActive: true,
            autoApply: false
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } else if (previousSettings.couponCode) {
      await Coupon.findOneAndUpdate(
        { code: previousSettings.couponCode },
        { $set: { isActive: false, autoApply: false } }
      );
    }

    const settings = await updateSettings({
      enableNotification: parsed.data.enableNotification,
      couponCode,
      discountType: parsed.data.discountType,
      discountValue: parsed.data.discountValue,
      minOrderValue: parsed.data.minOrderValue
    });

    return apiSuccess({
      enableNotification: settings.enableNotification,
      couponCode: settings.couponCode,
      discountType: settings.discountType,
      discountValue: settings.discountValue,
      minOrderValue: settings.minOrderValue
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return apiError("A coupon with this code already exists.", 409);
    }

    logApiError("api/admin/settings/campaign", error);
    return apiError("Could not save campaign settings right now.", 500);
  }
}
