import { requireUser } from "@/lib/server/auth";
import { getUserOrders } from "@/lib/server/storefront";

export async function GET() {
  const user = await requireUser();
  if (user instanceof Response) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return Response.json({ orders: await getUserOrders(user._id) });
}
