import { z } from "zod";

import { NotificationMessage } from "@/lib/models/NotificationMessage";
import { User } from "@/lib/models/User";
import { logApiError, parseJsonBody } from "@/lib/server/api";
import { requireAdmin } from "@/lib/server/auth";
import { connectToDatabase } from "@/lib/server/db";
import { getSettings } from "@/lib/server/settings";

const audienceSchema = z.object({
  message: z.string().trim().min(3).max(220),
  audience: z.enum(["all", "frequentVisitors", "customers", "newUsers"])
});

function buildAudienceQuery(audience: z.infer<typeof audienceSchema>["audience"]) {
  if (audience === "frequentVisitors") {
    return { notificationPermission: "granted", visitCount: { $gte: 5 } };
  }

  if (audience === "customers") {
    return { notificationPermission: "granted", orderCount: { $gt: 0 } };
  }

  if (audience === "newUsers") {
    return {
      notificationPermission: "granted",
      createdAt: { $gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7) }
    };
  }

  return { notificationPermission: "granted" };
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof Response) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const parsed = audienceSchema.safeParse(await parseJsonBody(request));
    if (!parsed.success) {
      return Response.json({ error: "Please provide a valid message and audience." }, { status: 400 });
    }

    const settings = await getSettings();
    if (!settings.enableNotification) {
      return Response.json({ error: "Notifications are disabled in campaign settings." }, { status: 400 });
    }

    await connectToDatabase();
    const users = await User.find(buildAudienceQuery(parsed.data.audience)).select("_id").lean<any[]>();

    if (!users.length) {
      return Response.json({ error: "No notification subscribers found for this audience." }, { status: 404 });
    }

    await NotificationMessage.insertMany(
      users.map((user) => ({
        user: user._id,
        message: parsed.data.message,
        segment: parsed.data.audience
      }))
    );

    console.log("[Notifications] admin notification queued", {
      adminId: admin._id,
      audience: parsed.data.audience,
      recipients: users.length
    });

    return Response.json({ success: true, recipients: users.length });
  } catch (error) {
    logApiError("api/admin/send-notification", error);
    return Response.json({ error: "Could not send notifications right now." }, { status: 500 });
  }
}
