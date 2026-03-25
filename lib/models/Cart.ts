import { Schema, model, models, type InferSchemaType } from "mongoose";

const cartItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const cartSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    items: { type: [cartItemSchema], default: [] },
    couponCode: { type: String, trim: true, uppercase: true }
  },
  {
    timestamps: true
  }
);

export type CartDocument = InferSchemaType<typeof cartSchema>;

export const Cart = models.Cart || model("Cart", cartSchema);
