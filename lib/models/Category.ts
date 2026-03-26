import { Schema, model, models, type InferSchemaType } from "mongoose";

const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
      index: true
    }
  },
  {
    timestamps: true
  }
);

categorySchema.index({ name: 1 }, { unique: true });

export type CategoryDocument = InferSchemaType<typeof categorySchema>;

export const Category = models.Category || model("Category", categorySchema);
