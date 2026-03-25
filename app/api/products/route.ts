import { getCatalogProducts, getSpecialCategoryTitle } from "@/lib/server/storefront";

export async function GET() {
  const [products, specialCategoryTitle] = await Promise.all([getCatalogProducts(), getSpecialCategoryTitle()]);
  const safeProducts = Array.isArray(products) ? products : [];
  const categories = [...new Set(safeProducts.map((product) => product?.category).filter(Boolean))];

  return Response.json({
    success: true,
    data: {
      products: safeProducts,
      categories,
      specialCategoryTitle
    },
    products: safeProducts,
    categories,
    specialCategoryTitle
  });
}
