import { z } from "zod";

import { Coupon } from "@/lib/models/Coupon";
import { User } from "@/lib/models/User";
import { logApiError, parseJsonBody } from "@/lib/server/api";
import { requireUser } from "@/lib/server/auth";
import { connectToDatabase } from "@/lib/server/db";
import { getSettings } from "@/lib/server/settings";

const rewardSchema = z.object({
  permission: z.literal("granted")
});

export async function POST(request: Request) {
  const currentUser = await requireUser();
  if (currentUser instanceof Response) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const parsed = rewardSchema.safeParse(await parseJsonBody(request));
    if (!parsed.success) {
      return Response.json({ success: false, error: "Please allow notifications to receive reward." }, { status: 400 });
    }

    await connectToDatabase();
    const settings = await getSettings();

    const user = await User.findById(currentUser._id);
    if (!user) {
      return Response.json({ success: false, error: "User not found." }, { status: 404 });
    }

    const rewardCode = String(settings.notificationRewardCode ?? "").trim().toUpperCase();
    const rewardType = settings.notificationRewardType === "flat" ? "fixed" : "percentage";
    const rewardValue = Number(settings.notificationRewardValue ?? 0);
    const rewardMinOrderValue = Number(settings.notificationRewardMinOrderValue ?? 0);
    const notificationsEnabled = Boolean(settings.enableNotification);

    if (!notificationsEnabled) {
      return Response.json({ success: false, error: "Notification rewards are currently disabled." }, { status: 400 });
    }

    if (user.notificationRewardClaimed) {
      return Response.json({
        success: true,
        alreadyClaimed: true,
        coupon: rewardCode
          ? {
              code: rewardCode,
              type: rewardType,
              value: rewardValue,
              minOrderValue: rewardMinOrderValue
            }
          : null
      });
    }

    let coupon = null;
    const hasRewardCoupon = Boolean(rewardCode && rewardValue > 0);

    if (hasRewardCoupon) {
      coupon = await Coupon.findOneAndUpdate(
        { code: rewardCode },
        {
          $set: {
            code: rewardCode,
            description: "Notification subscriber reward",
            type: rewardType,
            value: rewardValue,
            minOrderValue: rewardMinOrderValue,
            autoApply: false,
            isActive: true,
            source: "notification_reward"
          },
          $addToSet: {
            issuedToUsers: user._id
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    user.notificationPermission = "granted";
    user.notificationEnabled = true;
    user.notificationRewardClaimed = hasRewardCoupon;
    user.notificationPromptedAt = new Date();
    user.lastSeenAt = new Date();
    await user.save();

    return Response.json({
      success: true,
      coupon: coupon
        ? {
            code: coupon.code,
            description: coupon.description ?? "",
            type: coupon.type,
            value: coupon.value,
            minOrderValue: coupon.minOrderValue ?? 0
          }
        : null,
      rewardConfigured: hasRewardCoupon
    });
  } catch (error) {
    logApiError("api/reward-notification", error);
    return Response.json({ success: false, error: "Could not issue the notification reward right now." }, { status: 500 });
  }
}
