import dotenv from "dotenv";

import { Cart } from "@/lib/models/Cart";
import { Coupon } from "@/lib/models/Coupon";
import { Product } from "@/lib/models/Product";
import { User } from "@/lib/models/User";
import { connectToDatabase } from "@/lib/server/db";
import { getEnv } from "@/lib/server/env";
import { hashPassword } from "@/lib/server/auth";
import { sampleCoupons, sampleProducts } from "@/lib/server/sample-data";

dotenv.config({ path: ".env.local" });
dotenv.config();

async function seed() {
  const env = getEnv();
  await connectToDatabase();

  for (const product of sampleProducts) {
    await Product.findOneAndUpdate(
      { slug: product.slug },
      {
        ...product,
        reviews: product.reviews.map((review) => ({
          ...review,
          date: new Date(review.date)
        })),
        flashSale: product.flashSale
          ? {
              ...product.flashSale,
              endsAt: new Date(product.flashSale.endsAt)
            }
          : undefined
      },
      { upsert: true, new: true }
    );
  }

  for (const coupon of sampleCoupons) {
    await Coupon.findOneAndUpdate(
      { code: coupon.code },
      {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        autoApply: coupon.autoApply,
        isActive: true,
        minOrderValue: 999
      },
      { upsert: true, new: true }
    );
  }

  const admin = await User.findOneAndUpdate(
    { email: env.adminEmail.toLowerCase() },
    {
      name: "Pretty Parcel Admin",
      email: env.adminEmail.toLowerCase(),
      password: await hashPassword(env.adminPassword),
      role: "admin",
      wishlist: [],
      preferences: {
        favoriteCategories: ["Bouquets", "Gift Hampers"]
      },
      lastSeenAt: new Date()
    },
    { upsert: true, new: true }
  );

  await Cart.findOneAndUpdate({ user: admin._id }, { user: admin._id, items: [] }, { upsert: true, new: true });

  console.log("Seed complete.");
  console.log(`Products: ${sampleProducts.length}`);
  console.log(`Coupons: ${sampleCoupons.length}`);
  console.log(`Admin: ${env.adminEmail}`);
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
