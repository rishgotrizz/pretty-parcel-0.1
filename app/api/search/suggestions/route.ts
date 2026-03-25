import { getCatalogProducts } from "@/lib/server/storefront";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim().toLowerCase();
  if (!query) {
    return Response.json({ suggestions: [] });
  }

  const products = await getCatalogProducts();
  const suggestions = products
    .filter((product) => product.name.toLowerCase().includes(query))
    .slice(0, 5)
    .map((product) => product.name);

  return Response.json({ suggestions });
}
