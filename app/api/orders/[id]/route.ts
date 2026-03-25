import { isObjectId } from "@/lib/server/api";
import { requireUser } from "@/lib/server/auth";
import { getOrderByIdForUser } from "@/lib/server/storefront";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if (user instanceof Response) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!isObjectId(id)) {
    return Response.json({ error: "Invalid order id." }, { status: 400 });
  }
  const order = await getOrderByIdForUser(id, user._id, user.role === "admin");
  if (!order) {
    return Response.json({ error: "Order not found." }, { status: 404 });
  }

  return Response.json({ order });
}
