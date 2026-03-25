import { Order } from "@/lib/models/Order";
import { isObjectId, logApiError } from "@/lib/server/api";
import { requireAdmin } from "@/lib/server/auth";
import { connectToDatabase } from "@/lib/server/db";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (admin instanceof Response) {
    return Response.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    if (!isObjectId(id)) {
      return Response.json({ success: false, error: "Invalid order id." }, { status: 400 });
    }

    await connectToDatabase();
    const deletedOrder = await Order.findByIdAndDelete(id);
    if (!deletedOrder) {
      return Response.json({ success: false, error: "Order not found." }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    logApiError("api/admin/orders/[id]:DELETE", error);
    return Response.json({ success: false, error: "Could not delete order right now." }, { status: 500 });
  }
}
