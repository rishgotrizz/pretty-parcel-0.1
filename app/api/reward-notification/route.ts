import { z } from "zod";

import { Coupon } from "@/lib/models/Coupon";
import { User } from "@/lib/models/User";
import { logApiError, parseJsonBody } from "@/lib/server/api";
import { requireUser } from "@/lib/server/auth";
import { connectToDatabase } from "@/lib/server/db";

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

    const user = await User.findById(currentUser._id);
    if (!user) {
      return Response.json({ success: false, error: "User not found." }, { status: 404 });
    }

    if (user.notificationRewardClaimed) {
      return Response.json({
        success: true,
        alreadyClaimed: true,
        coupon: {
          code: "NOTIFY100",
          value: 100
        }
      });
    }

    const coupon = await Coupon.findOneAndUpdate(
      { code: "NOTIFY100" },
      {
        $set: {
          code: "NOTIFY100",
          description: "Rs.100 reward for enabling browser notifications",
          type: "fixed",
          value: 100,
          minOrderValue: 0,
          autoApply: false,
          isActive: true
        },
        $addToSet: {
          issuedToUsers: user._id
        }
      },
      { upsert: true, new: true }
    );

    user.notificationPermission = "granted";
    user.notificationEnabled = true;
    user.notificationRewardClaimed = true;
    user.notificationPromptedAt = new Date();
    user.lastSeenAt = new Date();
    await user.save();

    return Response.json({
      success: true,
      coupon: {
        code: coupon.code,
        description: coupon.description ?? "",
        value: coupon.value
      }
    });
  } catch (error) {
    logApiError("api/reward-notification", error);
    return Response.json({ success: false, error: "Could not issue the notification reward right now." }, { status: 500 });
  }
}
