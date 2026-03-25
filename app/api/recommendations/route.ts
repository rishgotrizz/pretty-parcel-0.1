import { getCurrentUser } from "@/lib/server/auth";
import { getRecommendationsForUser } from "@/lib/server/recommendations";

export async function GET() {
  const user = await getCurrentUser();
  const products = await getRecommendationsForUser(user?._id);
  return Response.json({
    products: products.map((product: any) => ({
      ...product,
      _id: product._id?.toString?.() ?? product._id
    }))
  });
}
