import { z } from "zod";

import { logApiError, parseJsonBody } from "@/lib/server/api";
import { requireAdmin } from "@/lib/server/auth";
import { getSettings, updateSettings } from "@/lib/server/settings";

const marketingSchema = z.object({
  specialCategoryTitle: z.string().trim().min(3).max(80)
});

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof Response) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await getSettings();
  return Response.json({
    specialCategoryTitle: settings.specialCategoryName
  });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof Response) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const parsed = marketingSchema.safeParse(await parseJsonBody(request));
    if (!parsed.success) {
      return Response.json({ error: "Please provide a valid special category title." }, { status: 400 });
    }

    await updateSettings({ specialCategoryName: parsed.data.specialCategoryTitle });

    return Response.json({ success: true, specialCategoryTitle: parsed.data.specialCategoryTitle });
  } catch (error) {
    logApiError("api/admin/marketing", error);
    return Response.json({ error: "Could not update marketing settings right now." }, { status: 500 });
  }
}
