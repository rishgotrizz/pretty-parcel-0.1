import { z } from "zod";

import { Coupon } from "@/lib/models/Coupon";
import { apiError, apiSuccess, isDuplicateKeyError, logApiError, parseJsonBody } from "@/lib/server/api";
import { requireAdmin } from "@/lib/server/auth";
import { connectToDatabase } from "@/lib/server/db";
import { getSettings, updateSettings } from "@/lib/server/settings";

const campaignSchema = z.object({
  enableNotification: z.boolean(),
  notificationRewardCode: z.string().trim().max(40).optional().or(z.literal("")),
  notificationRewardType: z.enum(["percentage", "flat"]),
  notificationRewardValue: z.coerce.number().min(0),
  notificationRewardMinOrderValue: z.coerce.number().min(0)
});

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof Response) {
    return apiError("Forbidden", 403);
  }

  const settings = await getSettings();
  return apiSuccess({
    enableNotification: settings.enableNotification,
    notificationRewardCode: settings.notificationRewardCode,
    notificationRewardType: settings.notificationRewardType,
    notificationRewardValue: settings.notificationRewardValue,
    notificationRewardMinOrderValue: settings.notificationRewardMinOrderValue
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
      return apiError("Please provide valid notification reward settings.", 400);
    }

    const previousSettings = await getSettings();
    const rewardCode = parsed.data.notificationRewardCode?.trim().toUpperCase() ?? "";

    if (rewardCode && parsed.data.notificationRewardValue <= 0) {
      return apiError("Reward value must be greater than 0 when a reward code is set.", 400);
    }

    await connectToDatabase();

    if (rewardCode) {
      const existingCoupon = await Coupon.findOne({ code: rewardCode }).lean<any>();
      if (
        existingCoupon &&
        existingCoupon.source === "general" &&
        rewardCode !== previousSettings.notificationRewardCode
      ) {
        return apiError("This coupon code is already used in normal coupons. Choose a different reward code.", 409);
      }
    }

    if (
      previousSettings.notificationRewardCode &&
      previousSettings.notificationRewardCode !== rewardCode
    ) {
      await Coupon.findOneAndUpdate(
        { code: previousSettings.notificationRewardCode, source: "notification_reward" },
        { $set: { isActive: false, autoApply: false } }
      );
    }

    if (rewardCode) {
      await Coupon.findOneAndUpdate(
        { code: rewardCode },
        {
          $set: {
            code: rewardCode,
            description: "Notification subscriber reward",
            type: parsed.data.notificationRewardType === "flat" ? "fixed" : "percentage",
            value: parsed.data.notificationRewardValue,
            minOrderValue: parsed.data.notificationRewardMinOrderValue,
            isActive: true,
            autoApply: false,
            source: "notification_reward"
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } else if (previousSettings.notificationRewardCode) {
      await Coupon.findOneAndUpdate(
        { code: previousSettings.notificationRewardCode, source: "notification_reward" },
        { $set: { isActive: false, autoApply: false } }
      );
    }

    const settings = await updateSettings({
      enableNotification: parsed.data.enableNotification,
      notificationRewardCode: rewardCode,
      notificationRewardType: parsed.data.notificationRewardType,
      notificationRewardValue: parsed.data.notificationRewardValue,
      notificationRewardMinOrderValue: parsed.data.notificationRewardMinOrderValue
    });

    return apiSuccess({
      enableNotification: settings.enableNotification,
      notificationRewardCode: settings.notificationRewardCode,
      notificationRewardType: settings.notificationRewardType,
      notificationRewardValue: settings.notificationRewardValue,
      notificationRewardMinOrderValue: settings.notificationRewardMinOrderValue
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return apiError("A coupon with this code already exists.", 409);
    }

    logApiError("api/admin/settings/campaign", error);
    return apiError("Could not save campaign settings right now.", 500);
  }
}
