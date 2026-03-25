import { ProductsExplorer } from "@/components/products/products-explorer";
import { SectionHeading } from "@/components/shared/section-heading";
import { getCatalogProducts } from "@/lib/server/storefront";
import { sampleCategories } from "@/lib/server/sample-data";

export default async function ProductsPage() {
  const products = await getCatalogProducts();

  return (
    <div className="pb-10">
      <section className="section-shell pt-12">
        <SectionHeading
          eyebrow="Shop"
          title="A website storefront for every pretty parcel you imagine"
          description="Explore bouquets, portraits, keychains, scrapbooks, and custom keepsakes in a premium Instagram-inspired product grid."
        />
      </section>
      <ProductsExplorer products={products} categories={sampleCategories} />
    </div>
  );
}
