import { AppSetting } from "@/lib/models/AppSetting";
import { Settings } from "@/lib/models/Settings";
import { connectToDatabase } from "@/lib/server/db";

export type StoreSettings = {
  logoUrl: string;
  heroImageUrl: string;
  faviconUrl: string;
  whatsNewText: string;
  storeMoodText: string;
  specialCategoryName: string;
};

const defaultSettings: StoreSettings = {
  logoUrl: "",
  heroImageUrl: "",
  faviconUrl: "",
  whatsNewText: "",
  storeMoodText: "Soft, premium gifting with a polished premium feel.",
  specialCategoryName: "Special Picks"
};

async function hydrateFromLegacySettings() {
  const [brandingSetting, specialCategorySetting] = await Promise.all([
    AppSetting.findOne({ key: "brand-assets" }).lean<any>(),
    AppSetting.findOne({ key: "special-category-title" }).lean<any>()
  ]);

  return {
    logoUrl: brandingSetting?.value?.logoUrl ?? "",
    heroImageUrl: brandingSetting?.value?.heroImageUrl ?? "",
    faviconUrl: brandingSetting?.value?.faviconUrl ?? "",
    whatsNewText: brandingSetting?.value?.whatsNewText ?? "",
    storeMoodText: brandingSetting?.value?.storeMoodText ?? defaultSettings.storeMoodText,
    specialCategoryName:
      typeof specialCategorySetting?.value === "string" && specialCategorySetting.value.trim()
        ? specialCategorySetting.value
        : defaultSettings.specialCategoryName
  };
}

export async function getSettings(): Promise<StoreSettings> {
  await connectToDatabase();

  let settings = await Settings.findOne({ singletonKey: "main" }).lean<any>();
  if (!settings) {
    const legacyValues = await hydrateFromLegacySettings();
    settings = await Settings.create({
      singletonKey: "main",
      ...defaultSettings,
      ...legacyValues
    });
    return {
      logoUrl: settings.logoUrl ?? "",
      heroImageUrl: settings.heroImageUrl ?? "",
      faviconUrl: settings.faviconUrl ?? "",
      whatsNewText: settings.whatsNewText ?? "",
      storeMoodText: settings.storeMoodText ?? defaultSettings.storeMoodText,
      specialCategoryName: settings.specialCategoryName ?? defaultSettings.specialCategoryName
    };
  }

  return {
    logoUrl: settings.logoUrl ?? "",
    heroImageUrl: settings.heroImageUrl ?? "",
    faviconUrl: settings.faviconUrl ?? "",
    whatsNewText: settings.whatsNewText ?? "",
    storeMoodText: settings.storeMoodText ?? defaultSettings.storeMoodText,
    specialCategoryName: settings.specialCategoryName ?? defaultSettings.specialCategoryName
  };
}

export async function updateSettings(input: Partial<StoreSettings>): Promise<StoreSettings> {
  await connectToDatabase();

  const nextValues = {
    ...defaultSettings,
    ...(await getSettings()),
    ...input
  };

  const settings = await Settings.findOneAndUpdate(
    { singletonKey: "main" },
    { singletonKey: "main", ...nextValues },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean<any>();

  return {
    logoUrl: settings.logoUrl ?? "",
    heroImageUrl: settings.heroImageUrl ?? "",
    faviconUrl: settings.faviconUrl ?? "",
    whatsNewText: settings.whatsNewText ?? "",
    storeMoodText: settings.storeMoodText ?? defaultSettings.storeMoodText,
    specialCategoryName: settings.specialCategoryName ?? defaultSettings.specialCategoryName
  };
}
