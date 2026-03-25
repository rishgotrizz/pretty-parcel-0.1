import { getBrandAssets } from "@/lib/server/storefront";

export async function GET() {
  const settings = await getBrandAssets();
  const branding = settings ?? {};

  return Response.json({
    success: true,
    data: {
      branding
    },
    branding
  });
}
