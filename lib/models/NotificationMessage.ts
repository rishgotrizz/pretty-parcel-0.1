import { Schema, model, models, type InferSchemaType } from "mongoose";

const notificationMessageSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    message: { type: String, required: true, trim: true, maxlength: 240 },
    segment: { type: String, required: true, trim: true },
    readAt: { type: Date }
  },
  {
    timestamps: true
  }
);

notificationMessageSchema.index({ user: 1, readAt: 1, createdAt: -1 });

export type NotificationMessageDocument = InferSchemaType<typeof notificationMessageSchema>;

export const NotificationMessage =
  models.NotificationMessage || model("NotificationMessage", notificationMessageSchema);
