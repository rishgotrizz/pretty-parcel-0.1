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
        notificationEnabled: true,
        lastSeenAt: new Date()
      }
    });

    return Response.json({
      success: true
    });
  } catch (error) {
    logApiError("api/notifications/subscribe", error);
    return Response.json({ error: "Could not enable notifications right now." }, { status: 500 });
  }
}
