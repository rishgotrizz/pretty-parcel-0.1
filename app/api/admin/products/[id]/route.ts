import { Cart } from "@/lib/models/Cart";
import { Product } from "@/lib/models/Product";
import { User } from "@/lib/models/User";
import { isObjectId, logApiError } from "@/lib/server/api";
import { requireAdmin } from "@/lib/server/auth";
import { connectToDatabase } from "@/lib/server/db";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (admin instanceof Response) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    if (!isObjectId(id)) {
      return Response.json({ error: "Product id required." }, { status: 400 });
    }

    await connectToDatabase();
    const deletedProduct = await Product.findByIdAndUpdate(
      id,
      {
        $set: {
          isDeleted: true,
          isActive: false
        }
      },
      { new: true }
    );
    if (!deletedProduct) {
      return Response.json({ error: "Product not found." }, { status: 404 });
    }

    await Promise.all([
      Cart.updateMany({}, { $pull: { items: { product: id } } }),
      User.updateMany({}, { $pull: { wishlist: id } })
    ]);

    return Response.json({ success: true });
  } catch (error) {
    logApiError("api/admin/products/[id]", error);
    return Response.json({ error: "Could not delete product right now." }, { status: 500 });
  }
}
