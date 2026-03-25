"use client";

import Link from "next/link";

import { ProductsExplorer } from "@/components/products/products-explorer";
import { useProductsFeed } from "@/components/products/use-products-feed";
import { SectionHeading } from "@/components/shared/section-heading";

export default function ProductsPage() {
  const { products, categories, loading } = useProductsFeed();

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
        <ProductsExplorer products={products} categories={categories} />
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
