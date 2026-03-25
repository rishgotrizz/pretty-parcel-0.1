"use client";

import { useEffect, useState } from "react";

import type { ProductType } from "@/types";

type ProductsFeed = {
  products: ProductType[];
  categories: string[];
  specialCategoryTitle: string;
  loading: boolean;
  reload: () => Promise<void>;
};

const PRODUCTS_EVENT = "pretty-parcel-products-updated";

export function broadcastProductsUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(PRODUCTS_EVENT));
  window.localStorage.setItem("pretty-parcel-products-sync", String(Date.now()));
}

export function useProductsFeed(): ProductsFeed {
  const [products, setProducts] = useState<ProductType[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [specialCategoryTitle, setSpecialCategoryTitle] = useState("Special Picks");
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/products", {
        cache: "no-store",
        headers: { Accept: "application/json" }
      });
      const raw = await response.text();
      const data = raw ? JSON.parse(raw) : {};
      const payload = data?.data ?? data ?? {};

      setProducts(Array.isArray(payload.products) ? payload.products : []);
      setCategories(Array.isArray(payload.categories) ? payload.categories : []);
      setSpecialCategoryTitle(typeof payload.specialCategoryTitle === "string" ? payload.specialCategoryTitle : "Special Picks");
    } catch (error) {
      console.error("[useProductsFeed] load failed", error);
      setProducts([]);
      setCategories([]);
      setSpecialCategoryTitle("Special Picks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();

    const handleProductSync = () => {
      void reload();
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "pretty-parcel-products-sync") {
        void reload();
      }
    };

    window.addEventListener(PRODUCTS_EVENT, handleProductSync);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(PRODUCTS_EVENT, handleProductSync);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return {
    products,
    categories,
    specialCategoryTitle,
    loading,
    reload
  };
}
