import { Schema, model, models, type InferSchemaType } from "mongoose";

const analyticsEventSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", index: true },
    sessionId: { type: String, required: true, index: true },
    eventType: { type: String, required: true, index: true },
    path: { type: String, required: true },
    label: { type: String },
    metadata: { type: Schema.Types.Mixed },
    durationMs: { type: Number }
  },
  {
    timestamps: true
  }
);

export type AnalyticsEventDocument = InferSchemaType<typeof analyticsEventSchema>;

export const AnalyticsEvent =
  models.AnalyticsEvent || model("AnalyticsEvent", analyticsEventSchema);
