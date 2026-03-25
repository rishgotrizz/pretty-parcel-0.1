import { Schema, model, models, type InferSchemaType } from "mongoose";

const settingsSchema = new Schema(
  {
    singletonKey: { type: String, required: true, unique: true, default: "main", index: true },
    logoUrl: { type: String, trim: true, default: "" },
    heroImageUrl: { type: String, trim: true, default: "" },
    faviconUrl: { type: String, trim: true, default: "" },
    whatsNewText: { type: String, trim: true, default: "" },
    specialCategoryName: { type: String, trim: true, default: "Special Picks" }
  },
  {
    timestamps: true
  }
);

export type SettingsDocument = InferSchemaType<typeof settingsSchema>;

export const Settings = models.Settings || model("Settings", settingsSchema);
