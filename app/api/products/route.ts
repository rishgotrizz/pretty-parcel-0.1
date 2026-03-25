import { getCatalogProducts, getSpecialCategoryTitle } from "@/lib/server/storefront";

export async function GET() {
  const [products, specialCategoryTitle] = await Promise.all([getCatalogProducts(), getSpecialCategoryTitle()]);
  return Response.json({ products, specialCategoryTitle });
}
