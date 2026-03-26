import { AppSetting } from "@/lib/models/AppSetting";
import { Settings } from "@/lib/models/Settings";
import { connectToDatabase } from "@/lib/server/db";

export type StoreSettings = {
  logoUrl: string;
  heroImageUrl: string;
  faviconUrl: string;
  whatsNewText: string;
  storeMoodText: string;
  enableNotification: boolean;
  couponCode: string;
  discountType: "percentage" | "flat";
  discountValue: number;
  minOrderValue: number;
  notificationRewardCode: string;
  notificationRewardType: "percentage" | "flat";
  notificationRewardValue: number;
  notificationRewardMinOrderValue: number;
  shippingPrice: number;
  freeShippingThreshold: number;
  specialCategoryName: string;
};

const defaultSettings: StoreSettings = {
  logoUrl: "",
  heroImageUrl: "",
  faviconUrl: "",
  whatsNewText: "",
  storeMoodText: "Soft, premium gifting with a polished premium feel.",
  enableNotification: true,
  couponCode: "",
  discountType: "percentage",
  discountValue: 0,
  minOrderValue: 0,
  notificationRewardCode: "",
  notificationRewardType: "flat",
  notificationRewardValue: 0,
  notificationRewardMinOrderValue: 0,
  shippingPrice: 149,
  freeShippingThreshold: 1999,
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
    enableNotification: Boolean(brandingSetting?.value?.enableNotification ?? defaultSettings.enableNotification),
    couponCode: String(brandingSetting?.value?.couponCode ?? defaultSettings.couponCode).toUpperCase(),
    discountType: brandingSetting?.value?.discountType === "flat" ? "flat" : defaultSettings.discountType,
    discountValue: Number(brandingSetting?.value?.discountValue ?? defaultSettings.discountValue),
    minOrderValue: Number(brandingSetting?.value?.minOrderValue ?? defaultSettings.minOrderValue),
    notificationRewardCode: String(
      brandingSetting?.value?.notificationRewardCode ??
        brandingSetting?.value?.couponCode ??
        defaultSettings.notificationRewardCode
    ).toUpperCase(),
    notificationRewardType:
      brandingSetting?.value?.notificationRewardType === "percentage"
        ? "percentage"
        : brandingSetting?.value?.discountType === "percentage"
          ? "percentage"
          : defaultSettings.notificationRewardType,
    notificationRewardValue: Number(
      brandingSetting?.value?.notificationRewardValue ??
        brandingSetting?.value?.discountValue ??
        defaultSettings.notificationRewardValue
    ),
    notificationRewardMinOrderValue: Number(
      brandingSetting?.value?.notificationRewardMinOrderValue ??
        brandingSetting?.value?.minOrderValue ??
        defaultSettings.notificationRewardMinOrderValue
    ),
    shippingPrice: Number(brandingSetting?.value?.shippingPrice ?? defaultSettings.shippingPrice),
    freeShippingThreshold: Number(brandingSetting?.value?.freeShippingThreshold ?? defaultSettings.freeShippingThreshold),
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
      enableNotification: Boolean(settings.enableNotification ?? defaultSettings.enableNotification),
      couponCode: String(settings.couponCode ?? defaultSettings.couponCode).toUpperCase(),
      discountType: settings.discountType === "flat" ? "flat" : defaultSettings.discountType,
      discountValue: Number(settings.discountValue ?? defaultSettings.discountValue),
      minOrderValue: Number(settings.minOrderValue ?? defaultSettings.minOrderValue),
      notificationRewardCode: String(
        settings.notificationRewardCode ?? settings.couponCode ?? defaultSettings.notificationRewardCode
      ).toUpperCase(),
      notificationRewardType:
        settings.notificationRewardType === "percentage"
          ? "percentage"
          : settings.discountType === "percentage"
            ? "percentage"
            : defaultSettings.notificationRewardType,
      notificationRewardValue: Number(
        settings.notificationRewardValue ?? settings.discountValue ?? defaultSettings.notificationRewardValue
      ),
      notificationRewardMinOrderValue: Number(
        settings.notificationRewardMinOrderValue ??
          settings.minOrderValue ??
          defaultSettings.notificationRewardMinOrderValue
      ),
      shippingPrice: Number(settings.shippingPrice ?? defaultSettings.shippingPrice),
      freeShippingThreshold: Number(settings.freeShippingThreshold ?? defaultSettings.freeShippingThreshold),
      specialCategoryName: settings.specialCategoryName ?? defaultSettings.specialCategoryName
    };
  }

  return {
    logoUrl: settings.logoUrl ?? "",
    heroImageUrl: settings.heroImageUrl ?? "",
    faviconUrl: settings.faviconUrl ?? "",
    whatsNewText: settings.whatsNewText ?? "",
    storeMoodText: settings.storeMoodText ?? defaultSettings.storeMoodText,
    enableNotification: Boolean(settings.enableNotification ?? defaultSettings.enableNotification),
    couponCode: String(settings.couponCode ?? defaultSettings.couponCode).toUpperCase(),
    discountType: settings.discountType === "flat" ? "flat" : defaultSettings.discountType,
    discountValue: Number(settings.discountValue ?? defaultSettings.discountValue),
    minOrderValue: Number(settings.minOrderValue ?? defaultSettings.minOrderValue),
    notificationRewardCode: String(
      settings.notificationRewardCode ?? settings.couponCode ?? defaultSettings.notificationRewardCode
    ).toUpperCase(),
    notificationRewardType:
      settings.notificationRewardType === "percentage"
        ? "percentage"
        : settings.discountType === "percentage"
          ? "percentage"
          : defaultSettings.notificationRewardType,
    notificationRewardValue: Number(
      settings.notificationRewardValue ?? settings.discountValue ?? defaultSettings.notificationRewardValue
    ),
    notificationRewardMinOrderValue: Number(
      settings.notificationRewardMinOrderValue ??
        settings.minOrderValue ??
        defaultSettings.notificationRewardMinOrderValue
    ),
    shippingPrice: Number(settings.shippingPrice ?? defaultSettings.shippingPrice),
    freeShippingThreshold: Number(settings.freeShippingThreshold ?? defaultSettings.freeShippingThreshold),
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
    enableNotification: Boolean(settings.enableNotification ?? defaultSettings.enableNotification),
    couponCode: String(settings.couponCode ?? defaultSettings.couponCode).toUpperCase(),
    discountType: settings.discountType === "flat" ? "flat" : defaultSettings.discountType,
    discountValue: Number(settings.discountValue ?? defaultSettings.discountValue),
    minOrderValue: Number(settings.minOrderValue ?? defaultSettings.minOrderValue),
    notificationRewardCode: String(
      settings.notificationRewardCode ?? settings.couponCode ?? defaultSettings.notificationRewardCode
    ).toUpperCase(),
    notificationRewardType:
      settings.notificationRewardType === "percentage"
        ? "percentage"
        : settings.discountType === "percentage"
          ? "percentage"
          : defaultSettings.notificationRewardType,
    notificationRewardValue: Number(
      settings.notificationRewardValue ?? settings.discountValue ?? defaultSettings.notificationRewardValue
    ),
    notificationRewardMinOrderValue: Number(
      settings.notificationRewardMinOrderValue ??
        settings.minOrderValue ??
        defaultSettings.notificationRewardMinOrderValue
    ),
    shippingPrice: Number(settings.shippingPrice ?? defaultSettings.shippingPrice),
    freeShippingThreshold: Number(settings.freeShippingThreshold ?? defaultSettings.freeShippingThreshold),
    specialCategoryName: settings.specialCategoryName ?? defaultSettings.specialCategoryName
  };
}
