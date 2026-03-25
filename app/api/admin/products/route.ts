import { z } from "zod";

import { Cart } from "@/lib/models/Cart";
import { Product } from "@/lib/models/Product";
import { User } from "@/lib/models/User";
import { isDuplicateKeyError, isObjectId, logApiError, parseJsonBody } from "@/lib/server/api";
import { requireAdmin } from "@/lib/server/auth";
import { connectToDatabase } from "@/lib/server/db";
import { slugify } from "@/lib/utils";

const baseProductSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(2),
  shortDescription: z.string().min(12).max(160),
  description: z.string().min(20),
  price: z.coerce.number().min(0),
  compareAtPrice: z.coerce.number().min(0).optional(),
  stock: z.coerce.number().int().min(0),
  images: z.array(z.string().min(1)).min(1),
  tags: z.array(z.string()).default([]),
  specifications: z.array(z.string()).default([]),
  customisationNotes: z.string().optional(),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  flashSalePrice: z.coerce.number().positive().optional(),
  flashSaleEndsAt: z.string().optional()
});

const productSchema = baseProductSchema
  .superRefine((value, ctx) => {
    if (value.compareAtPrice && value.compareAtPrice < value.price) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Compare-at price must be greater than or equal to the selling price.",
        path: ["compareAtPrice"]
      });
    }

    if (value.flashSalePrice && value.flashSalePrice >= value.price) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Flash sale price must be lower than the regular price.",
        path: ["flashSalePrice"]
      });
    }

    if (value.flashSalePrice && !value.flashSaleEndsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Flash sale end date is required when flash sale price is set.",
        path: ["flashSaleEndsAt"]
      });
    }
  });

const updateSchema = baseProductSchema.extend({
  id: z.string()
}).superRefine((value, ctx) => {
  if (value.compareAtPrice && value.compareAtPrice < value.price) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Compare-at price must be greater than or equal to the selling price.",
      path: ["compareAtPrice"]
    });
  }

  if (value.flashSalePrice && value.flashSalePrice >= value.price) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Flash sale price must be lower than the regular price.",
      path: ["flashSalePrice"]
    });
  }

  if (value.flashSalePrice && !value.flashSaleEndsAt) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Flash sale end date is required when flash sale price is set.",
      path: ["flashSaleEndsAt"]
    });
  }
});

function toArray(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  return String(value ?? "")
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function toBoolean(value: unknown) {
  return value === true || value === "true" || value === "on" || value === "1";
}

function toOptionalNumber(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normaliseProductPayload(payload: Record<string, unknown>) {
  return {
    name: String(payload.name ?? ""),
    category: String(payload.category ?? ""),
    shortDescription: String(payload.shortDescription ?? ""),
    description: String(payload.description ?? ""),
    price: Number(payload.price ?? 0),
    compareAtPrice: toOptionalNumber(payload.compareAtPrice),
    stock: Number(payload.stock ?? 0),
    images: toArray(payload.images),
    tags: toArray(payload.tags),
    specifications: toArray(payload.specifications),
    customisationNotes: String(payload.customisationNotes ?? "").trim() || undefined,
    isFeatured: toBoolean(payload.isFeatured),
    isActive: payload.isActive === undefined ? true : toBoolean(payload.isActive),
    flashSalePrice: toOptionalNumber(payload.flashSalePrice),
    flashSaleEndsAt: String(payload.flashSaleEndsAt ?? "").trim() || undefined
  };
}

async function buildUniqueSlug(name: string, currentId?: string) {
  const baseSlug = slugify(name);
  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    const existing = await Product.findOne({ slug: candidate }).select("_id").lean<any>();
    if (!existing || existing._id?.toString() === currentId) {
      return candidate;
    }
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

function buildFlashSale(data: z.infer<typeof productSchema>) {
  if (!data.flashSalePrice || !data.flashSaleEndsAt) {
    return {
      isActive: false,
      price: data.price,
      endsAt: undefined
    };
  }

  return {
    isActive: new Date(data.flashSaleEndsAt) > new Date(),
    price: data.flashSalePrice,
    endsAt: new Date(data.flashSaleEndsAt)
  };
}

function buildProductWritePayload(data: z.infer<typeof productSchema>, slug: string) {
  return {
    name: data.name,
    slug,
    shortDescription: data.shortDescription,
    description: data.description,
    price: data.price,
    compareAtPrice: data.compareAtPrice,
    category: data.category,
    tags: data.tags.length ? data.tags : [data.category.toLowerCase(), "handmade"],
    stock: data.stock,
    isFeatured: data.isFeatured,
    isActive: data.isActive,
    images: data.images,
    specifications: data.specifications.length
      ? data.specifications
      : ["Handmade with care", "Gift-ready packaging", "Crafted for special occasions"],
    customisationNotes: data.customisationNotes,
    flashSale: buildFlashSale(data),
    seo: {
      title: `${data.name} | The Pretty Parcel`,
      description: data.shortDescription
    }
  };
}

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof Response) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectToDatabase();
  const products = await Product.find().sort({ createdAt: -1 }).lean();
  return Response.json({
    products: (products as any[]).map((product) => ({
      _id: product._id.toString(),
      name: product.name,
      category: product.category,
      shortDescription: product.shortDescription,
      description: product.description,
      stock: product.stock,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      images: product.images ?? [],
      tags: product.tags ?? [],
      specifications: product.specifications ?? [],
      customisationNotes: product.customisationNotes,
      isFeatured: Boolean(product.isFeatured),
      isActive: Boolean(product.isActive),
      flashSalePrice: product.flashSale?.price,
      flashSaleEndsAt: product.flashSale?.endsAt ? new Date(product.flashSale.endsAt).toISOString().slice(0, 16) : ""
    }))
  });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof Response) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const rawPayload = await parseJsonBody<Record<string, unknown>>(request);
    const parsed = productSchema.safeParse(normaliseProductPayload(rawPayload));
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid product payload." }, { status: 400 });
    }

    await connectToDatabase();
    const slug = await buildUniqueSlug(parsed.data.name);
    const product = await Product.create({
      ...buildProductWritePayload(parsed.data, slug),
      popularity: 60,
      reviews: []
    });

    return Response.json({ product: { _id: product._id.toString(), name: product.name } });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return Response.json({ error: "A product with similar details already exists." }, { status: 409 });
    }

    logApiError("api/admin/products:POST", error);
    return Response.json({ error: "Could not create product right now." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof Response) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const rawPayload = await parseJsonBody<Record<string, unknown>>(request);
    const parsed = updateSchema.safeParse({
      id: rawPayload.id,
      ...normaliseProductPayload(rawPayload)
    });
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid product payload." }, { status: 400 });
    }
    if (!isObjectId(parsed.data.id)) {
      return Response.json({ error: "Invalid product id." }, { status: 400 });
    }

    await connectToDatabase();
    const existing = await Product.findById(parsed.data.id);
    if (!existing) {
      return Response.json({ error: "Product not found." }, { status: 404 });
    }

    const slug = await buildUniqueSlug(parsed.data.name, parsed.data.id);
    await Product.findByIdAndUpdate(parsed.data.id, {
      ...buildProductWritePayload(parsed.data, slug)
    });

    return Response.json({ success: true });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return Response.json({ error: "A product with similar details already exists." }, { status: 409 });
    }

    logApiError("api/admin/products:PATCH", error);
    return Response.json({ error: "Could not update product right now." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof Response) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id || !isObjectId(id)) {
    return Response.json({ error: "Product id required." }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const deletedProduct = await Product.findByIdAndDelete(id);
    if (!deletedProduct) {
      return Response.json({ error: "Product not found." }, { status: 404 });
    }

    await Promise.all([
      Cart.updateMany({}, { $pull: { items: { product: id } } }),
      User.updateMany({}, { $pull: { wishlist: id } })
    ]);

    return Response.json({ success: true });
  } catch (error) {
    logApiError("api/admin/products:DELETE", error);
    return Response.json({ error: "Could not delete product right now." }, { status: 500 });
  }
}
