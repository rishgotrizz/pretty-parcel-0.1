import { Schema, model, models, type InferSchemaType } from "mongoose";

const settingsSchema = new Schema(
  {
    singletonKey: { type: String, required: true, unique: true, default: "main", index: true },
    logoUrl: { type: String, trim: true, default: "" },
    heroImageUrl: { type: String, trim: true, default: "" },
    faviconUrl: { type: String, trim: true, default: "" },
    whatsNewText: { type: String, trim: true, default: "" },
    storeMoodText: { type: String, trim: true, default: "Soft, premium gifting with a polished premium feel." },
    enableNotification: { type: Boolean, default: true },
    couponCode: { type: String, trim: true, uppercase: true, default: "" },
    discountType: { type: String, enum: ["percentage", "flat"], default: "percentage" },
    discountValue: { type: Number, default: 0, min: 0 },
    minOrderValue: { type: Number, default: 0, min: 0 },
    shippingPrice: { type: Number, default: 149, min: 0 },
    freeShippingThreshold: { type: Number, default: 1999, min: 0 },
    specialCategoryName: { type: String, trim: true, default: "Special Picks" }
  },
  {
    timestamps: true
  }
);

export type SettingsDocument = InferSchemaType<typeof settingsSchema>;

export const Settings = models.Settings || model("Settings", settingsSchema);
