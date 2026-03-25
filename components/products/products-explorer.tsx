"use client";

import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { useDeferredValue, useEffect, useState } from "react";

import { ProductCard } from "@/components/products/product-card";
import { trackClientEvent } from "@/components/providers/analytics-tracker";
import type { ProductType } from "@/types";

const sortOptions = [
  { value: "featured", label: "Featured" },
  { value: "price-low", label: "Price: Low to high" },
  { value: "price-high", label: "Price: High to low" },
  { value: "popular", label: "Most popular" }
];

export function ProductsExplorer({
  products,
  categories
}: {
  products: ProductType[];
  categories: string[];
}) {
  const safeProducts = Array.isArray(products) ? products : [];
  const safeCategories = Array.isArray(categories) ? categories : [];
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("featured");
  const [maxPrice, setMaxPrice] = useState(4000);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    if (!deferredQuery.trim()) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    fetch(`/api/search/suggestions?q=${encodeURIComponent(deferredQuery)}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" }
    })
      .then(async (response) => {
        const raw = await response.text();
        return raw ? JSON.parse(raw) : {};
      })
      .then((data) => {
        const nextSuggestions = data?.suggestions ?? data?.data?.suggestions;
        setSuggestions(Array.isArray(nextSuggestions) ? nextSuggestions : []);
      })
      .catch(() => setSuggestions([]));

    return () => controller.abort();
  }, [deferredQuery]);

  const filteredProducts = safeProducts
    .filter((product) => (category === "All" ? true : product.category === category))
    .filter((product) => product.price <= maxPrice)
    .filter((product) => {
      if (!deferredQuery.trim()) {
        return true;
      }
      const haystack = `${product?.name ?? ""} ${product?.description ?? ""} ${(Array.isArray(product?.tags) ? product.tags : []).join(" ")}`.toLowerCase();
      return haystack.includes(deferredQuery.toLowerCase());
    })
    .sort((a, b) => {
      if (sort === "price-low") {
        return a.price - b.price;
      }
      if (sort === "price-high") {
        return b.price - a.price;
      }
      if (sort === "popular") {
        return b.popularity - a.popularity;
      }
      return Number(b.isFeatured) - Number(a.isFeatured) || b.popularity - a.popularity;
    });

  return (
    <div className="section-shell py-10">
      <div className="glass-panel rounded-[2rem] p-5 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[1.4fr_repeat(3,0.7fr)]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-rosewood/60" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                trackClientEvent({ eventType: "search", path: "/products", label: event.target.value });
              }}
              placeholder="Search bouquets, portraits, keychains..."
              className="w-full rounded-full border border-white/70 bg-white/90 py-3 pl-11 pr-4 text-sm outline-none ring-0"
            />
            {suggestions.length ? (
              <div className="absolute top-[calc(100%+0.75rem)] z-20 w-full rounded-[1.5rem] border border-white/80 bg-white/95 p-3 shadow-card">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    className="block w-full rounded-xl px-3 py-2 text-left text-sm text-rosewood transition hover:bg-rosewater"
                    onClick={() => setQuery(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="rounded-full border border-white/70 bg-white/90 px-4 py-3 text-sm outline-none"
          >
            <option value="All">All categories</option>
            {safeCategories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="rounded-full border border-white/70 bg-white/90 px-4 py-3 text-sm outline-none"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-3 rounded-full border border-white/70 bg-white/90 px-4 py-3 text-sm text-rosewood">
            <SlidersHorizontal className="h-4 w-4" />
            <span>Up to Rs. {maxPrice}</span>
            <input
              type="range"
              min={500}
              max={5000}
              step={100}
              value={maxPrice}
              onChange={(event) => setMaxPrice(Number(event.target.value))}
              className="w-full accent-berry"
            />
          </label>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-rosewood/70">{filteredProducts.length} products ready to gift</p>
        <Link href="/cart" className="text-sm font-semibold text-berry">
          Go to cart
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {filteredProducts.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </div>
  );
}
