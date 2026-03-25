import { requireAdmin } from "@/lib/server/auth";
import { buildAdminAnalytics } from "@/lib/server/analytics";

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof Response) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  return Response.json(await buildAdminAnalytics());
}
