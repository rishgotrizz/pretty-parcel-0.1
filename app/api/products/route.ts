import { getCatalogProducts } from "@/lib/server/storefront";

export async function GET() {
  const products = await getCatalogProducts();
  return Response.json({ products });
}
