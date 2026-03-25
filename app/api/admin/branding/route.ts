import { z } from "zod";

import { logApiError, parseJsonBody } from "@/lib/server/api";
import { requireAdmin } from "@/lib/server/auth";
import { getSettings, updateSettings } from "@/lib/server/settings";

const brandingSchema = z.object({
  logoUrl: z.string().trim().optional().or(z.literal("")),
  heroImageUrl: z.string().trim().optional().or(z.literal("")),
  faviconUrl: z.string().trim().optional().or(z.literal("")),
  whatsNewText: z.string().trim().max(180).optional().or(z.literal(""))
});

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof Response) {
    return Response.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const settings = await getSettings();
  return Response.json({
    success: true,
    branding: settings ?? {
      logoUrl: "",
      heroImageUrl: "",
      faviconUrl: "",
      whatsNewText: "",
      specialCategoryName: "Special Picks"
    }
  });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof Response) {
    return Response.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const parsed = brandingSchema.safeParse(await parseJsonBody(request));
    if (!parsed.success) {
      return Response.json({ success: false, error: "Please upload valid branding images." }, { status: 400 });
    }

    const branding = await updateSettings({
      logoUrl: parsed.data.logoUrl ?? "",
      heroImageUrl: parsed.data.heroImageUrl ?? "",
      faviconUrl: parsed.data.faviconUrl ?? "",
      whatsNewText: parsed.data.whatsNewText ?? ""
    });

    return Response.json({
      success: true,
      branding
    });
  } catch (error) {
    logApiError("api/admin/branding", error);
    return Response.json({ success: false, error: "Could not save brand customization right now." }, { status: 500 });
  }
}
