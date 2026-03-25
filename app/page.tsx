"use client";

import { useEffect, useState } from "react";

import { HeroSection } from "@/components/home/hero-section";
import { useProductsFeed } from "@/components/products/use-products-feed";
import { ProductActions } from "@/components/products/product-actions";
import { ProductCard } from "@/components/products/product-card";
import { ReviewsSection } from "@/components/home/reviews-section";
import { EmptyState } from "@/components/shared/empty-state";
import type { StoreReview } from "@/types";

export default function HomePage() {
  const { products, specialCategoryTitle, loading } = useProductsFeed();
  const [reviews, setReviews] = useState<StoreReview[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadReviews() {
      try {
        const response = await fetch("/api/reviews", {
          cache: "no-store",
          headers: { Accept: "application/json" }
        });
        const reviewsRaw = await response.text();
        const reviewsData = reviewsRaw ? JSON.parse(reviewsRaw) : {};

        if (!cancelled) {
          setReviews(Array.isArray(reviewsData.reviews) ? reviewsData.reviews : []);
        }
      } catch (error) {
        console.error("[HomePage] failed to load reviews", error);
        if (!cancelled) {
          setReviews([]);
        }
      }
    }

    void loadReviews();

    return () => {
      cancelled = true;
    };
  }, []);

  const featuredProducts = products.slice(0, 6);
  const specialProducts = products.filter((product) => product.isSpecial).slice(0, 3);
  const flashSaleEndsAt = products.find((product) => product.flashSale?.isActive)?.flashSale?.endsAt;

  return (
    <div className="pb-16">
      <section className="section-shell">
        <HeroSection flashSaleEndsAt={flashSaleEndsAt} />
      </section>

      <section className="section-shell mt-14 sm:mt-20">
        <div className="mb-8 space-y-3 sm:mb-10">
          <h2 className="font-serif text-4xl text-slate-900 sm:text-5xl">Handmade gifts for every beautiful moment</h2>
          <p className="max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
            Browse bouquets, portraits, keychains, and keepsakes curated for a soft premium gifting experience.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-[32rem] animate-pulse rounded-[2rem] border border-pink-100/80 bg-white/70 shadow-[var(--shadow-card)]"
              />
            ))}
          </div>
        ) : featuredProducts.length ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {featuredProducts.map((product) => (
              <div key={product._id ?? product.slug} className="space-y-4">
                <ProductCard product={product} />
                {product._id ? (
                  <div className="rounded-[1.75rem] border border-pink-100/80 bg-white/80 p-4 shadow-[var(--shadow-card)]">
                    <ProductActions
                      productId={product._id}
                      productName={product.slug}
                      category={product.category}
                    />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No products available"
            description="We’re preparing the next pretty parcel collection. Please check back shortly."
          />
        )}
      </section>

      {!loading && specialProducts.length ? (
        <section className="section-shell mt-14 sm:mt-20">
          <div className="mb-8 space-y-3 sm:mb-10">
            <h2 className="font-serif text-4xl text-slate-900 sm:text-5xl">{specialCategoryTitle}</h2>
            <p className="max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
              Curated picks from the current campaign, highlighted by the admin for gifting moments that need extra sparkle.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {specialProducts.map((product) => (
              <div key={`special-${product._id ?? product.slug}`} className="space-y-4">
                <ProductCard product={product} />
                {product._id ? (
                  <div className="rounded-[1.75rem] border border-pink-100/80 bg-white/80 p-4 shadow-[var(--shadow-card)]">
                    <ProductActions productId={product._id} productName={product.slug} category={product.category} />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {!loading ? <ReviewsSection reviews={reviews} /> : null}
    </div>
  );
}
