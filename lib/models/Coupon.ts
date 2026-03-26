import { Schema, model, models, type InferSchemaType } from "mongoose";

const couponSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    description: { type: String, trim: true, maxlength: 180 },
    type: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
      alias: "discountType",
      set(value: string) {
        return value === "flat" ? "fixed" : value;
      }
    },
    value: { type: Number, required: true, min: 0, alias: "discountValue" },
    maxDiscount: { type: Number, min: 0 },
    minOrderValue: { type: Number, min: 0, default: 0 },
    startsAt: { type: Date },
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true },
    autoApply: { type: Boolean, default: false },
    source: {
      type: String,
      enum: ["general", "notification_reward"],
      default: "general",
      index: true
    },
    applicableCategories: [{ type: String }],
    issuedToUsers: [{ type: Schema.Types.ObjectId, ref: "User" }]
  },
  {
    timestamps: true
  }
);

couponSchema.path("value").validate(function validateCouponValue(value: number) {
  if (this.type === "percentage") {
    return value <= 100;
  }
  return true;
}, "Percentage coupons cannot exceed 100.");

export type CouponDocument = InferSchemaType<typeof couponSchema>;

export const Coupon = models.Coupon || model("Coupon", couponSchema);
