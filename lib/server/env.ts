const requiredKeys = ["MONGODB_URI", "JWT_SECRET"] as const;

export function getEnv() {
  for (const key of requiredKeys) {
    if (!process.env[key]) {
      throw new Error(`Missing environment variable: ${key}`);
    }
  }

  return {
    mongoUri: process.env.MONGODB_URI as string,
    mongoDbName: process.env.MONGODB_DB_NAME ?? "pretty-parcel",
    jwtSecret: process.env.JWT_SECRET as string,
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET,
    nextPublicRazorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    enableMockPayments: process.env.ENABLE_MOCK_PAYMENTS !== "false",
    adminEmail: process.env.ADMIN_EMAIL ?? "admin@theprettyparcel.com",
    adminPassword: process.env.ADMIN_PASSWORD ?? "PrettyParcel@123"
  };
}
