import { Schema, model, models, type InferSchemaType } from "mongoose";

const reviewSchema = new Schema(
  {
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    date: { type: Date, required: true }
  },
  { _id: false }
);

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true, trim: true, lowercase: true },
    shortDescription: { type: String, required: true, trim: true, maxlength: 180 },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    category: { type: String, required: true, index: true, trim: true },
    tags: [{ type: String, trim: true }],
    stock: { type: Number, required: true, min: 0 },
    popularity: { type: Number, default: 0, index: true },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    images: {
      type: [{ type: String, trim: true }],
      validate: {
        validator: (value: string[]) => Array.isArray(value) && value.length > 0,
        message: "At least one product image is required."
      }
    },
    specifications: { type: [{ type: String, trim: true }], default: [] },
    customisationNotes: { type: String, trim: true },
    reviews: { type: [reviewSchema], default: [] },
    seo: {
      title: { type: String },
      description: { type: String }
    },
    flashSale: {
      isActive: { type: Boolean, default: false },
      price: { type: Number, min: 0 },
      endsAt: { type: Date }
    }
  },
  {
    timestamps: true
  }
);

productSchema.index({ category: 1, popularity: -1 });
productSchema.index({ isActive: 1, isFeatured: -1, popularity: -1 });

export type ProductDocument = InferSchemaType<typeof productSchema>;

export const Product = models.Product || model("Product", productSchema);
