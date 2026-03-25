import { z } from "zod";

import { AnalyticsEvent } from "@/lib/models/AnalyticsEvent";
import { User } from "@/lib/models/User";
import { logApiError, parseJsonBody } from "@/lib/server/api";
import { getCurrentUser } from "@/lib/server/auth";
import { connectToDatabase } from "@/lib/server/db";

const analyticsSchema = z.object({
  sessionId: z.string().trim().max(120).optional(),
  eventType: z
    .enum(["page_view", "click", "time_spent", "cart", "wishlist", "search", "checkout", "chatbot"])
    .optional(),
  path: z.string().trim().max(300).optional(),
  label: z.string().trim().max(160).optional(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
  durationMs: z.number().int().min(0).max(1000 * 60 * 60 * 12).optional()
});

export async function POST(request: Request) {
  try {
    const parsed = analyticsSchema.safeParse(await parseJsonBody(request));
    if (!parsed.success) {
      return Response.json({ error: "Invalid analytics payload." }, { status: 400 });
    }

    await connectToDatabase();
    const user = await getCurrentUser();

    await AnalyticsEvent.create({
      user: user?._id,
      sessionId: parsed.data.sessionId ?? "anonymous",
      eventType: parsed.data.eventType ?? "page_view",
      path: parsed.data.path ?? "/",
      label: parsed.data.label,
      metadata: parsed.data.metadata,
      durationMs: parsed.data.durationMs
    });

    if (user?._id && parsed.data.eventType === "page_view") {
      await User.findByIdAndUpdate(user._id, {
        $inc: { visitCount: 1 },
        $set: { lastSeenAt: new Date() }
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    logApiError("api/analytics/track", error);
    return Response.json({ error: "Could not record analytics event." }, { status: 500 });
  }
}
