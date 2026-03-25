import { notFound } from "next/navigation";
import { Star } from "lucide-react";

import { ProductActions } from "@/components/products/product-actions";
import { FlashSaleTimer } from "@/components/shared/flash-sale-timer";
import { getProductBySlug } from "@/lib/server/storefront";
import { formatCurrency } from "@/lib/utils";

export default async function ProductDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug, { incrementView: true });

  if (!product) {
    notFound();
  }

  const liveSale =
    product.flashSale?.isActive && new Date(product.flashSale.endsAt) > new Date() ? product.flashSale.price : null;

  return (
    <div className="section-shell grid gap-10 py-8 sm:py-12 lg:grid-cols-[1fr_0.95fr]">
      <div className="space-y-5">
        <img src={product.images[0]} alt={product.name} className="h-[320px] w-full rounded-[2.5rem] object-cover shadow-glow sm:h-[460px]" />
        <div className="grid gap-4 sm:grid-cols-2">
          {product.images.map((image) => (
            <img key={image} src={image} alt={product.name} className="h-44 w-full rounded-[1.75rem] object-cover" />
          ))}
        </div>
      </div>

      <div className="space-y-7">
        <div className="space-y-4">
          <span className="inline-flex rounded-full bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-rosewood/70">
            {product.category}
          </span>
          <h1 className="font-serif text-4xl text-cocoa sm:text-5xl">{product.name}</h1>
          <p className="max-w-xl text-base leading-8 text-rosewood/85">{product.description}</p>
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-3xl font-semibold text-cocoa">{formatCurrency(liveSale ?? product.price)}</p>
            {product.compareAtPrice ? (
              <p className="text-lg text-rosewood/60 line-through">{formatCurrency(product.compareAtPrice)}</p>
            ) : null}
            {liveSale && product.flashSale?.endsAt ? <FlashSaleTimer endsAt={product.flashSale.endsAt} /> : null}
          </div>
        </div>

        <ProductActions productId={product._id ?? product.slug} productName={product.slug} category={product.category} />

        <div className="glass-panel rounded-[2rem] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rosewood/70">Why it feels premium</p>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-rosewood/85">
            {product.specifications.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
          {product.customisationNotes ? (
            <div className="mt-5 rounded-[1.5rem] bg-white/80 p-4 text-sm text-rosewood/80">
              <span className="font-semibold text-cocoa">Customisation:</span> {product.customisationNotes}
            </div>
          ) : null}
        </div>

        <div className="glass-panel rounded-[2rem] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rosewood/70">Reviews</p>
          <div className="mt-5 space-y-4">
            {product.reviews.map((review) => (
              <div key={`${review.name}-${review.date}`} className="rounded-[1.5rem] bg-white/80 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-cocoa">{review.name}</p>
                  <div className="inline-flex items-center gap-1 text-sm text-rosewood">
                    <Star className="h-4 w-4 fill-gold text-gold" />
                    {review.rating}
                  </div>
                </div>
                <p className="mt-2 text-sm leading-7 text-rosewood/80">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
