import { getBrandAssets } from "@/lib/server/storefront";

export async function GET() {
  const branding = await getBrandAssets();
  return Response.json({ success: true, branding });
}
