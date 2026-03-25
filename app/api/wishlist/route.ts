import { Types } from "mongoose";
import { z } from "zod";

import { Product } from "@/lib/models/Product";
import { User } from "@/lib/models/User";
import { requireUser } from "@/lib/server/auth";
import { connectToDatabase } from "@/lib/server/db";
import { getWishlistProducts } from "@/lib/server/storefront";

export async function GET() {
  const user = await requireUser();
  if (user instanceof Response) {
    return Response.json({ error: "Login required." }, { status: 401 });
  }

  const products = await getWishlistProducts(user.wishlist ?? []);
  return Response.json({ products });
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (user instanceof Response) {
    return Response.json({ error: "Please login to use wishlist." }, { status: 401 });
  }

  const parsed = z.object({ productId: z.string() }).safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid wishlist request." }, { status: 400 });
  }
  if (!Types.ObjectId.isValid(parsed.data.productId)) {
    return Response.json({ error: "Seed the database before using wishlist actions." }, { status: 400 });
  }

  await connectToDatabase();
  const product = await Product.findById(parsed.data.productId);
  if (!product) {
    return Response.json({ error: "Product not found." }, { status: 404 });
  }

  await User.findByIdAndUpdate(user._id, {
    $addToSet: {
      wishlist: product._id,
      "preferences.favoriteCategories": product.category
    }
  });

  const updatedUser = await User.findById(user._id).lean<any>();
  return Response.json({
    wishlist: updatedUser?.wishlist?.map((item: { toString(): string }) => item.toString()) ?? []
  });
}

export async function DELETE(request: Request) {
  const user = await requireUser();
  if (user instanceof Response) {
    return Response.json({ error: "Please login to use wishlist." }, { status: 401 });
  }

  const parsed = z.object({ productId: z.string() }).safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid wishlist request." }, { status: 400 });
  }
  if (!Types.ObjectId.isValid(parsed.data.productId)) {
    return Response.json({ error: "Invalid product id." }, { status: 400 });
  }

  await connectToDatabase();
  await User.findByIdAndUpdate(user._id, {
    $pull: {
      wishlist: parsed.data.productId
    }
  });

  return Response.json({ success: true });
}
