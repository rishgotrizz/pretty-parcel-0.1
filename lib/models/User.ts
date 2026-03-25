import { Schema, model, models, type InferSchemaType } from "mongoose";

const addressSchema = new Schema(
  {
    fullName: String,
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

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    avatar: { type: String },
    googleId: { type: String },
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
    wishlist: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    addresses: [addressSchema],
    preferences: {
      favoriteCategories: [{ type: String }]
    },
    lastSeenAt: { type: Date },
    lastLogin: { type: Date, index: true },
    orderCount: { type: Number, default: 0, min: 0 },
    visitCount: { type: Number, default: 0, min: 0 },
    notificationPermission: { type: String, enum: ["default", "granted", "denied"], default: "default" },
    notificationPromptedAt: { type: Date }
  },
  {
    timestamps: true
  }
);

export type UserDocument = InferSchemaType<typeof userSchema>;

export const User = models.User || model("User", userSchema);
