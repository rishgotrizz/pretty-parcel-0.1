import { Schema, model, models, type InferSchemaType } from "mongoose";

const reviewSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 3, maxlength: 80 },
    text: { type: String, required: true, trim: true, minlength: 10, maxlength: 400 },
    imageUrl: { type: String, trim: true, default: "" }
  },
  {
    timestamps: true
  }
);

reviewSchema.index({ createdAt: -1 });

export type ReviewDocument = InferSchemaType<typeof reviewSchema>;

export const Review = models.Review || model("Review", reviewSchema);
