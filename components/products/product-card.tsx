import Link from "next/link";
import { Heart, Star } from "lucide-react";

import { Card } from "@/components/shared/card";
import { FlashSaleTimer } from "@/components/shared/flash-sale-timer";
import { formatCurrency } from "@/lib/utils";
import type { ProductType } from "@/types";

export function ProductCard({ product }: { product: ProductType }) {
  const salePrice =
    product.flashSale?.isActive && new Date(product.flashSale.endsAt) > new Date() ? product.flashSale.price : null;
  const savings = product.compareAtPrice && product.compareAtPrice > (salePrice ?? product.price)
    ? product.compareAtPrice - (salePrice ?? product.price)
    : 0;

  return (
    <Card className="group h-full overflow-hidden rounded-[2rem] border border-pink-100/80 bg-white/90 transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative overflow-hidden rounded-t-[2rem]">
          <img
            src={product.images[0]}
            alt={product.name}
            className="h-72 w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          />
          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-pink-700 shadow-sm">
                {product.category}
              </span>
              {product.isFeatured ? (
                <span className="rounded-full bg-pink-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                  Featured
                </span>
              ) : null}
            </div>
            <div className="rounded-full bg-white/95 p-2 text-pink-600 shadow-sm">
              <Heart className="h-4 w-4" />
            </div>
          </div>
          {savings ? (
            <div className="absolute bottom-4 left-4 rounded-full bg-slate-900/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur">
              Save {formatCurrency(savings)}
            </div>
          ) : null}
        </div>

        <div className="flex h-[calc(100%-18rem)] flex-col gap-4 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-serif text-[1.65rem] leading-tight text-slate-900">{product.name}</h3>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{product.shortDescription}</p>
            </div>
            <div className="inline-flex shrink-0 items-center gap-1 rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-700">
              <Star className="h-3.5 w-3.5 fill-pink-400 text-pink-400" />
              {(product.reviews?.[0]?.rating ?? 4.8).toFixed(1)}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {product.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-pink-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-pink-700"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-auto flex items-end justify-between gap-3 border-t border-pink-100 pt-4">
            <div className="space-y-1">
              <p className="text-xl font-semibold tracking-[-0.02em] text-slate-900">
                {formatCurrency(salePrice ?? product.price)}
              </p>
              {product.compareAtPrice ? (
                <p className="text-sm text-slate-400 line-through">{formatCurrency(product.compareAtPrice)}</p>
              ) : (
                <p className="text-sm text-pink-600">Handmade with premium packaging</p>
              )}
            </div>
            {salePrice && product.flashSale?.endsAt ? <FlashSaleTimer endsAt={product.flashSale.endsAt} /> : null}
          </div>
        </div>
      </Link>
    </Card>
  );
}
