"use client";

import Link from "next/link";

import { ProductCard } from "@/components/products/product-card";
import { ProductsExplorer } from "@/components/products/products-explorer";
import { useProductsFeed } from "@/components/products/use-products-feed";
import { SectionHeading } from "@/components/shared/section-heading";

export default function ProductsPage() {
  const { products, categories, loading } = useProductsFeed();
  const specialProducts = products.filter((product) => product?.isSpecial);
  const normalProducts = products.filter((product) => !product?.isSpecial);
  const normalCategories = [...new Set(normalProducts.map((product) => product?.category).filter(Boolean))] as string[];

  return (
    <div className="pb-10">
      <section className="section-shell pt-10 sm:pt-12">
        <SectionHeading
          eyebrow="Shop"
          title="A storefront for every pretty parcel you imagine"
          description="Explore bouquets, portraits, keychains, scrapbooks, and custom keepsakes in a premium Instagram-inspired product grid."
        />
      </section>

      {loading ? (
        <div className="section-shell py-10">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-[29rem] animate-pulse rounded-[2rem] border border-pink-100/80 bg-white/70 shadow-[var(--shadow-card)]" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {specialProducts.length ? (
            <section className="section-shell pt-4">
              <div className="mb-6 space-y-3">
                <h2 className="font-serif text-3xl text-slate-900 sm:text-4xl">Special Picks</h2>
                <p className="max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
                  Limited selections highlighted for gifting moments that deserve extra sparkle.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {specialProducts.map((product) => (
                  <ProductCard key={`shop-special-${product.slug}`} product={product} />
                ))}
              </div>
            </section>
          ) : null}
          <ProductsExplorer products={normalProducts} categories={normalCategories.length ? normalCategories : categories} />
        </>
      )}

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pb-4 sm:hidden">
        <div className="pointer-events-auto rounded-[1.5rem] border border-pink-100/80 bg-white/95 p-4 shadow-[var(--shadow-card)] backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rosewood/65">Shopping bag</p>
              <p className="mt-1 text-sm text-cocoa">Explore the latest handmade picks and jump to your cart anytime.</p>
            </div>
            <Link href="/cart" className="button-primary !px-5 !py-3">
              Cart
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
