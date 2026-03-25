import { z } from "zod";

import { AppSetting } from "@/lib/models/AppSetting";
import { logApiError, parseJsonBody } from "@/lib/server/api";
import { requireAdmin } from "@/lib/server/auth";
import { connectToDatabase } from "@/lib/server/db";

const marketingSchema = z.object({
  specialCategoryTitle: z.string().trim().min(3).max(80)
});

const SETTING_KEY = "special-category-title";

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof Response) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectToDatabase();
  const setting = await AppSetting.findOne({ key: SETTING_KEY }).lean<any>();
  return Response.json({
    specialCategoryTitle: typeof setting?.value === "string" ? setting.value : "Special Picks"
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

    await connectToDatabase();
    await AppSetting.findOneAndUpdate(
      { key: SETTING_KEY },
      { key: SETTING_KEY, value: parsed.data.specialCategoryTitle },
      { upsert: true, new: true }
    );

    return Response.json({ success: true, specialCategoryTitle: parsed.data.specialCategoryTitle });
  } catch (error) {
    logApiError("api/admin/marketing", error);
    return Response.json({ error: "Could not update marketing settings right now." }, { status: 500 });
  }
}
