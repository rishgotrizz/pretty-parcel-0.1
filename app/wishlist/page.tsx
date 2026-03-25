import Link from "next/link";

import { ProductCard } from "@/components/products/product-card";
import { EmptyState } from "@/components/shared/empty-state";
import { getCurrentUser } from "@/lib/server/auth";
import { getWishlistProducts } from "@/lib/server/storefront";

export default async function WishlistPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="section-shell py-16">
        <EmptyState
          title="Login to save your wishlist"
          description="Keep your favorite handmade gift ideas neatly saved for later."
          action={<Link href="/login?next=/wishlist" className="button-primary">Login now</Link>}
        />
      </div>
    );
  }

  const products = await getWishlistProducts(user.wishlist ?? []);

  if (!products.length) {
    return (
      <div className="section-shell py-16">
        <EmptyState
          title="No saved items yet"
          description="Use the wishlist to shortlist products before checkout."
          action={<Link href="/products" className="button-primary">Explore products</Link>}
        />
      </div>
    );
  }

  return (
    <div className="section-shell py-12">
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </div>
  );
}
