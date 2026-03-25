import crypto from "crypto";

import Razorpay from "razorpay";

import { getEnv } from "@/lib/server/env";

export function getRazorpayClient() {
  const { razorpayKeyId, razorpayKeySecret, enableMockPayments } = getEnv();
  if (!enableMockPayments && (!razorpayKeyId || !razorpayKeySecret)) {
    throw new Error("Razorpay keys are required when mock payments are disabled.");
  }
  if (!razorpayKeyId || !razorpayKeySecret) {
    return null;
  }

  return new Razorpay({
    key_id: razorpayKeyId,
    key_secret: razorpayKeySecret
  });
}

export function verifyRazorpaySignature({
  orderId,
  paymentId,
  signature
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  const { razorpayKeySecret } = getEnv();
  if (!razorpayKeySecret) {
    return false;
  }

  const generatedSignature = crypto
    .createHmac("sha256", razorpayKeySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return generatedSignature === signature;
}
