import { Schema, model, models, type InferSchemaType } from "mongoose";

const appSettingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true, index: true },
    value: { type: Schema.Types.Mixed, required: true }
  },
  {
    timestamps: true
  }
);

export type AppSettingDocument = InferSchemaType<typeof appSettingSchema>;

export const AppSetting = models.AppSetting || model("AppSetting", appSettingSchema);
