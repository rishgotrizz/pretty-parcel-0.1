import { z } from "zod";

import { logApiError, parseJsonBody } from "@/lib/server/api";
import { requireAdmin } from "@/lib/server/auth";
import { getSettings, updateSettings } from "@/lib/server/settings";

const shippingSchema = z.object({
  shippingPrice: z.coerce.number().min(0),
  freeShippingThreshold: z.coerce.number().min(0)
});

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof Response) {
    return Response.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const settings = await getSettings();
  return Response.json({
    success: true,
    shippingPrice: settings.shippingPrice,
    freeShippingThreshold: settings.freeShippingThreshold
  });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof Response) {
    return Response.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const parsed = shippingSchema.safeParse(await parseJsonBody(request));
    if (!parsed.success) {
      return Response.json({ success: false, error: "Please provide valid shipping settings." }, { status: 400 });
    }

    const settings = await updateSettings({
      shippingPrice: parsed.data.shippingPrice,
      freeShippingThreshold: parsed.data.freeShippingThreshold
    });

    return Response.json({
      success: true,
      shippingPrice: settings.shippingPrice,
      freeShippingThreshold: settings.freeShippingThreshold
    });
  } catch (error) {
    logApiError("api/admin/settings/shipping", error);
    return Response.json({ success: false, error: "Could not save shipping settings right now." }, { status: 500 });
  }
}
