import { Types } from "mongoose";
import { z } from "zod";

import { Cart } from "@/lib/models/Cart";
import { Product } from "@/lib/models/Product";
import { User } from "@/lib/models/User";
import { logApiError, parseJsonBody } from "@/lib/server/api";
import { requireUser } from "@/lib/server/auth";
import { connectToDatabase } from "@/lib/server/db";
import { getProductEffectivePrice } from "@/lib/server/pricing";
import { getUserCart } from "@/lib/server/storefront";

const cartSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(20)
});

const updateSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(20)
});

export async function GET() {
  const user = await requireUser();
  if (user instanceof Response) {
    return Response.json({ error: "Login required to access your cart." }, { status: 401 });
  }

  const cart = await getUserCart(user._id);
  return Response.json(cart);
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (user instanceof Response) {
    return Response.json({ error: "Please login to add items to cart." }, { status: 401 });
  }

  try {
    const parsed = cartSchema.safeParse(await parseJsonBody(request));
    if (!parsed.success) {
      return Response.json({ error: "Invalid cart payload." }, { status: 400 });
    }
    if (!Types.ObjectId.isValid(parsed.data.productId)) {
      return Response.json({ error: "Invalid product id." }, { status: 400 });
    }

    await connectToDatabase();
    const product = await Product.findById(parsed.data.productId);
    if (!product || !product.isActive) {
      return Response.json({ error: "Product not found." }, { status: 404 });
    }
    if (product.stock < 1) {
      return Response.json({ error: "This product is currently out of stock." }, { status: 400 });
    }

    const unitPrice = getProductEffectivePrice({
      price: product.price,
      flashSale: product.flashSale?.endsAt
        ? {
            isActive: product.flashSale.isActive,
            price: product.flashSale.price,
            endsAt: product.flashSale.endsAt.toISOString()
          }
        : undefined
    });

    const cart = await Cart.findOneAndUpdate(
      { user: user._id },
      { $setOnInsert: { user: user._id, items: [] } },
      { upsert: true, new: true }
    );

    const existingItem = cart.items.find(
      (item: { product: { toString(): string }; quantity: number; unitPrice: number }) =>
        item.product.toString() === parsed.data.productId
    );
    if (existingItem) {
      const nextQuantity = existingItem.quantity + parsed.data.quantity;
      if (nextQuantity > product.stock) {
        return Response.json(
          { error: `Only ${product.stock} unit${product.stock === 1 ? "" : "s"} left in stock.` },
          { status: 400 }
        );
      }
      existingItem.quantity = nextQuantity;
      existingItem.unitPrice = unitPrice;
    } else {
      if (parsed.data.quantity > product.stock) {
        return Response.json(
          { error: `Only ${product.stock} unit${product.stock === 1 ? "" : "s"} left in stock.` },
          { status: 400 }
        );
      }
      cart.items.push({
        product: product._id,
        quantity: parsed.data.quantity,
        unitPrice
      });
    }
    await cart.save();

    await User.findByIdAndUpdate(user._id, {
      $addToSet: {
        "preferences.favoriteCategories": product.category
      }
    });

    return Response.json(await getUserCart(user._id));
  } catch (error) {
    logApiError("api/cart:POST", error);
    return Response.json({ error: "We could not update your cart right now." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const user = await requireUser();
  if (user instanceof Response) {
    return Response.json({ error: "Please login to update your cart." }, { status: 401 });
  }

  try {
    const parsed = updateSchema.safeParse(await parseJsonBody(request));
    if (!parsed.success) {
      return Response.json({ error: "Invalid update payload." }, { status: 400 });
    }
    if (!Types.ObjectId.isValid(parsed.data.productId)) {
      return Response.json({ error: "Invalid product id." }, { status: 400 });
    }

    await connectToDatabase();
    const cart = await Cart.findOne({ user: user._id });
    if (!cart) {
      return Response.json({ error: "Cart not found." }, { status: 404 });
    }

    const item = cart.items.find(
      (line: { product: { toString(): string }; quantity: number }) =>
        line.product.toString() === parsed.data.productId
    );
    if (!item) {
      return Response.json({ error: "Cart item not found." }, { status: 404 });
    }

    const product = await Product.findById(parsed.data.productId);
    if (!product || !product.isActive) {
      return Response.json({ error: "Product not found." }, { status: 404 });
    }
    if (parsed.data.quantity > product.stock) {
      return Response.json(
        { error: `Only ${product.stock} unit${product.stock === 1 ? "" : "s"} left in stock.` },
        { status: 400 }
      );
    }

    item.quantity = parsed.data.quantity;
    item.unitPrice = getProductEffectivePrice({
      price: product.price,
      flashSale: product.flashSale?.endsAt
        ? {
            isActive: product.flashSale.isActive,
            price: product.flashSale.price,
            endsAt: product.flashSale.endsAt.toISOString()
          }
        : undefined
    });
    await cart.save();

    return Response.json(await getUserCart(user._id));
  } catch (error) {
    logApiError("api/cart:PATCH", error);
    return Response.json({ error: "We could not update your cart right now." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const user = await requireUser();
  if (user instanceof Response) {
    return Response.json({ error: "Please login to update your cart." }, { status: 401 });
  }

  try {
    const parsed = z.object({ productId: z.string() }).safeParse(await parseJsonBody(request));
    if (!parsed.success) {
      return Response.json({ error: "Invalid cart removal payload." }, { status: 400 });
    }
    if (!Types.ObjectId.isValid(parsed.data.productId)) {
      return Response.json({ error: "Invalid product id." }, { status: 400 });
    }

    await connectToDatabase();
    await Cart.findOneAndUpdate(
      { user: user._id },
      {
        $pull: {
          items: { product: parsed.data.productId }
        }
      }
    );

    return Response.json(await getUserCart(user._id));
  } catch (error) {
    logApiError("api/cart:DELETE", error);
    return Response.json({ error: "We could not update your cart right now." }, { status: 500 });
  }
}
