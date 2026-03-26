import { z } from "zod";

import { Category } from "@/lib/models/Category";
import { apiError, apiSuccess, isDuplicateKeyError, logApiError, parseJsonBody } from "@/lib/server/api";
import { requireAdmin } from "@/lib/server/auth";
import { connectToDatabase } from "@/lib/server/db";

const categorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required.").max(80, "Category name is too long.")
});

export async function GET() {
  try {
    await connectToDatabase();
    const categories = await Category.find().sort({ createdAt: -1 }).lean<any[]>();

    return apiSuccess(
      {
        categories: categories.map((category) => ({
          _id: category._id.toString(),
          name: category.name,
          createdAt: category.createdAt ? new Date(category.createdAt).toISOString() : new Date().toISOString()
        }))
      },
      undefined,
      {
        categories: categories.map((category) => ({
          _id: category._id.toString(),
          name: category.name,
          createdAt: category.createdAt ? new Date(category.createdAt).toISOString() : new Date().toISOString()
        }))
      }
    );
  } catch (error) {
    logApiError("api/categories:GET", error);
    return apiError("Could not load categories right now.", 500);
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof Response) {
    return apiError("Forbidden", 403);
  }

  try {
    const parsed = categorySchema.safeParse(await parseJsonBody(request));
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? "Category name is required.", 400);
    }

    await connectToDatabase();
    const normalizedName = parsed.data.name.trim();
    const existingCategory = await Category.findOne({
      name: { $regex: `^${normalizedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" }
    }).lean();

    if (existingCategory) {
      return apiError("A category with this name already exists.", 409);
    }

    const category = await Category.create({ name: normalizedName });

    return apiSuccess(
      {
        category: {
          _id: category._id.toString(),
          name: category.name,
          createdAt: category.createdAt ? category.createdAt.toISOString() : new Date().toISOString()
        }
      },
      { status: 201 },
      {
        category: {
          _id: category._id.toString(),
          name: category.name,
          createdAt: category.createdAt ? category.createdAt.toISOString() : new Date().toISOString()
        }
      }
    );
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return apiError("A category with this name already exists.", 409);
    }

    logApiError("api/categories:POST", error);
    return apiError("Could not create category right now.", 500);
  }
}
