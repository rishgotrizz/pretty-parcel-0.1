import { getSettings } from "@/lib/server/settings";

export async function GET() {
  const settings = await getSettings();
  return Response.json({
    success: true,
    data: {
      settings: {
        shippingPrice: settings.shippingPrice,
        freeShippingThreshold: settings.freeShippingThreshold,
        logoUrl: settings.logoUrl,
        heroImageUrl: settings.heroImageUrl,
        faviconUrl: settings.faviconUrl,
        whatsNewText: settings.whatsNewText,
        storeMoodText: settings.storeMoodText,
        specialCategoryName: settings.specialCategoryName
      }
    },
    error: null,
    settings: {
      shippingPrice: settings.shippingPrice,
      freeShippingThreshold: settings.freeShippingThreshold,
      logoUrl: settings.logoUrl,
      heroImageUrl: settings.heroImageUrl,
      faviconUrl: settings.faviconUrl,
      whatsNewText: settings.whatsNewText,
      storeMoodText: settings.storeMoodText,
      specialCategoryName: settings.specialCategoryName
    }
  });
}
