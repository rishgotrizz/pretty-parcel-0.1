import { Category } from "@/lib/models/Category";
import { apiError, apiSuccess, isObjectId, logApiError } from "@/lib/server/api";
import { requireAdmin } from "@/lib/server/auth";
import { connectToDatabase } from "@/lib/server/db";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (admin instanceof Response) {
    return apiError("Forbidden", 403);
  }

  const { id } = await params;
  if (!isObjectId(id)) {
    return apiError("Invalid category id.", 400);
  }

  try {
    await connectToDatabase();
    const deletedCategory = await Category.findByIdAndDelete(id);

    if (!deletedCategory) {
      return apiError("Category not found.", 404);
    }

    return apiSuccess({ deleted: true }, undefined, { deleted: true });
  } catch (error) {
    logApiError("api/categories/[id]:DELETE", error);
    return apiError("Could not delete category right now.", 500);
  }
}
