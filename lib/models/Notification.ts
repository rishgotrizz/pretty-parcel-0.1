import { Schema, model, models, type InferSchemaType } from "mongoose";

const notificationSchema = new Schema(
  {
    message: { type: String, required: true, trim: true, maxlength: 240 },
    target: {
      type: String,
      required: true,
      trim: true,
      enum: ["all", "newUsers", "customers", "frequentVisitors"]
    },
    sentAt: { type: Date, default: Date.now }
  },
  {
    timestamps: true
  }
);

export type NotificationDocument = InferSchemaType<typeof notificationSchema>;

export const Notification = models.Notification || model("Notification", notificationSchema);
