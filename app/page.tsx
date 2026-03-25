"use client";

import { useEffect, useState } from "react";

import { HeroSection } from "@/components/home/hero-section";
import { ProductActions } from "@/components/products/product-actions";
import { ProductCard } from "@/components/products/product-card";
import { EmptyState } from "@/components/shared/empty-state";
import type { ProductType } from "@/types";

export default function HomePage() {
  const [products, setProducts] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        const response = await fetch("/api/products", {
          cache: "no-store",
          headers: { Accept: "application/json" }
        });
        const raw = await response.text();
        const data = raw ? JSON.parse(raw) : {};

        if (!cancelled) {
          setProducts(Array.isArray(data.products) ? data.products : []);
        }
      } catch (error) {
        console.error("[HomePage] failed to load products", error);
        if (!cancelled) {
          setProducts([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  const featuredProducts = products.slice(0, 6);
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
    </div>
  );
}
