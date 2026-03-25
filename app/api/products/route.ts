import { getCatalogProducts, getSpecialCategoryTitle } from "@/lib/server/storefront";

export async function GET() {
  const [products, specialCategoryTitle] = await Promise.all([getCatalogProducts(), getSpecialCategoryTitle()]);
  const categories = [...new Set(products.map((product) => product.category).filter(Boolean))];
  return Response.json({ products, categories, specialCategoryTitle });
}
