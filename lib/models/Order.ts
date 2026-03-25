import { Schema, model, models, type InferSchemaType } from "mongoose";

const orderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    image: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const trackingEventSchema = new Schema(
  {
    status: { type: String, required: true },
    label: { type: String, required: true },
    at: { type: Date, required: true }
  },
  { _id: false }
);

const addressSchema = new Schema(
  {
    fullName: String,
    email: String,
    phone: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    postalCode: String,
    country: { type: String, default: "India" }
  },
  { _id: false }
);

const customizationDetailsSchema = new Schema(
  {
    giftMessage: { type: String, trim: true, maxlength: 240 },
    nameCustomization: { type: String, trim: true, maxlength: 120 },
    specialInstructions: { type: String, trim: true, maxlength: 400 }
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    checkoutSessionId: { type: String, index: true },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, required: true, min: 0, default: 0 },
    shippingFee: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
    couponCode: { type: String },
    status: {
      type: String,
      enum: ["pending", "paid", "processing", "shipped", "out_for_delivery", "delivered", "cancelled"],
      default: "pending"
    },
    payment: {
      provider: { type: String, default: "razorpay" },
      status: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
      razorpayOrderId: String,
      razorpayPaymentId: String,
      razorpaySignature: String,
      invoiceNumber: String,
      orderCreationLock: String,
      verificationLock: String,
      failureReason: String,
      verifiedAt: Date
    },
    shippingAddress: addressSchema,
    customizationDetails: customizationDetailsSchema,
    tracking: {
      trackingId: String,
      estimatedDelivery: Date,
      timeline: [trackingEventSchema]
    }
  },
  {
    timestamps: true
  }
);

orderSchema.index(
  { user: 1, checkoutSessionId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      checkoutSessionId: { $type: "string" }
    }
  }
);
orderSchema.index(
  { "payment.razorpayPaymentId": 1 },
  {
    unique: true,
    sparse: true
  }
);

export type OrderDocument = InferSchemaType<typeof orderSchema>;

export const Order = models.Order || model("Order", orderSchema);
