import { Types } from "mongoose";
import { z } from "zod";

import { Cart } from "@/lib/models/Cart";
import { Product } from "@/lib/models/Product";
import { User } from "@/lib/models/User";
import { apiError, apiSuccess, logApiError, parseJsonBody } from "@/lib/server/api";
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
    return apiError("Login required to access your cart.", 401);
  }

  const cart = await getUserCart(user._id);
  return apiSuccess(cart, undefined, cart as Record<string, unknown>);
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (user instanceof Response) {
    return apiError("Please login to add items to cart.", 401);
  }

  try {
    const parsed = cartSchema.safeParse(await parseJsonBody(request));
    if (!parsed.success) {
      return apiError("Invalid cart payload.", 400);
    }
    if (!Types.ObjectId.isValid(parsed.data.productId)) {
      return apiError("Invalid product id.", 400);
    }

    await connectToDatabase();
    const product = await Product.findById(parsed.data.productId);
    if (!product || !product.isActive) {
      return apiError("Product not found.", 404);
    }
    if (product.stock < 1) {
      return apiError("This product is currently out of stock.", 400);
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
        return apiError(`Only ${product.stock} unit${product.stock === 1 ? "" : "s"} left in stock.`, 400);
      }
      existingItem.quantity = nextQuantity;
      existingItem.unitPrice = unitPrice;
    } else {
      if (parsed.data.quantity > product.stock) {
        return apiError(`Only ${product.stock} unit${product.stock === 1 ? "" : "s"} left in stock.`, 400);
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

    const cartResponse = await getUserCart(user._id);
    return apiSuccess(cartResponse, undefined, cartResponse as Record<string, unknown>);
  } catch (error) {
    logApiError("api/cart:POST", error);
    return apiError("We could not update your cart right now.", 500);
  }
}

export async function PATCH(request: Request) {
  const user = await requireUser();
  if (user instanceof Response) {
    return apiError("Please login to update your cart.", 401);
  }

  try {
    const parsed = updateSchema.safeParse(await parseJsonBody(request));
    if (!parsed.success) {
      return apiError("Invalid update payload.", 400);
    }
    if (!Types.ObjectId.isValid(parsed.data.productId)) {
      return apiError("Invalid product id.", 400);
    }

    await connectToDatabase();
    const cart = await Cart.findOne({ user: user._id });
    if (!cart) {
      return apiError("Cart not found.", 404);
    }

    const item = cart.items.find(
      (line: { product: { toString(): string }; quantity: number }) =>
        line.product.toString() === parsed.data.productId
    );
    if (!item) {
      return apiError("Cart item not found.", 404);
    }

    const product = await Product.findById(parsed.data.productId);
    if (!product || !product.isActive) {
      return apiError("Product not found.", 404);
    }
    if (parsed.data.quantity > product.stock) {
      return apiError(`Only ${product.stock} unit${product.stock === 1 ? "" : "s"} left in stock.`, 400);
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

    const cartResponse = await getUserCart(user._id);
    return apiSuccess(cartResponse, undefined, cartResponse as Record<string, unknown>);
  } catch (error) {
    logApiError("api/cart:PATCH", error);
    return apiError("We could not update your cart right now.", 500);
  }
}

export async function DELETE(request: Request) {
  const user = await requireUser();
  if (user instanceof Response) {
    return apiError("Please login to update your cart.", 401);
  }

  try {
    const parsed = z.object({ productId: z.string() }).safeParse(await parseJsonBody(request));
    if (!parsed.success) {
      return apiError("Invalid cart removal payload.", 400);
    }
    if (!Types.ObjectId.isValid(parsed.data.productId)) {
      return apiError("Invalid product id.", 400);
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

    const cartResponse = await getUserCart(user._id);
    return apiSuccess(cartResponse, undefined, cartResponse as Record<string, unknown>);
  } catch (error) {
    logApiError("api/cart:DELETE", error);
    return apiError("We could not update your cart right now.", 500);
  }
}
