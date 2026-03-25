import { Coupon } from "@/lib/models/Coupon";
import { User } from "@/lib/models/User";
import { logApiError } from "@/lib/server/api";
import { requireUser } from "@/lib/server/auth";
import { connectToDatabase } from "@/lib/server/db";

export async function POST() {
  const user = await requireUser();
  if (user instanceof Response) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    await User.findByIdAndUpdate(user._id, {
      $set: {
        notificationPermission: "granted",
        notificationPromptedAt: new Date(),
        lastSeenAt: new Date()
      }
    });

    const coupon = await Coupon.findOneAndUpdate(
      { code: "WELCOME10" },
      {
        code: "WELCOME10",
        description: "Rs.10 reward for enabling notifications",
        type: "fixed",
        value: 10,
        minOrderValue: 0,
        autoApply: false,
        isActive: true
      },
      { upsert: true, new: true }
    );

    return Response.json({
      success: true,
      coupon: {
        code: coupon.code,
        description: coupon.description ?? "",
        value: coupon.value
      }
    });
  } catch (error) {
    logApiError("api/notifications/subscribe", error);
    return Response.json({ error: "Could not enable notifications right now." }, { status: 500 });
  }
}
