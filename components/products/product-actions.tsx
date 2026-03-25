"use client";

import { Heart, Minus, Plus, ShoppingBag } from "lucide-react";
import { useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { trackClientEvent } from "@/components/providers/analytics-tracker";

export function ProductActions({
  productId,
  productName,
  category
}: {
  productId: string;
  productName: string;
  category: string;
}) {
  const { refresh } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  const handleAddToCart = async () => {
    if (pending) {
      return;
    }

    try {
      setPending(true);
      setMessage("");

      console.debug("[ProductActions] add to cart clicked", {
        productId,
        productName,
        quantity
      });

      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include",
        body: JSON.stringify({ productId, quantity })
      });

      const raw = await response.text();
      const data = raw ? JSON.parse(raw) : {};

      console.debug("[ProductActions] add to cart response", {
        ok: response.ok,
        status: response.status,
        productId
      });

      if (!response.ok) {
        setMessage(data.error ?? "Please login to add this item.");
        return;
      }

      await refresh();
      window.dispatchEvent(new Event("pretty-parcel-cart-updated"));

      trackClientEvent({
        eventType: "cart",
        path: `/products/${productName}`,
        label: "add_to_cart",
        metadata: { productId, category, quantity }
      });

      setMessage("Added to cart.");
    } catch (error) {
      console.error("[ProductActions] add to cart failed", error);
      setMessage("We couldn't add this item to your cart. Please try again.");
    } finally {
      setPending(false);
    }
  };

  const handleWishlist = async () => {
    try {
      setMessage("");

      console.debug("[ProductActions] wishlist clicked", {
        productId,
        productName
      });

      const response = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include",
        body: JSON.stringify({ productId })
      });

      const raw = await response.text();
      const data = raw ? JSON.parse(raw) : {};

      console.debug("[ProductActions] wishlist response", {
        ok: response.ok,
        status: response.status,
        productId
      });

      setMessage(response.ok ? "Saved to wishlist." : data.error ?? "Please login to use wishlist.");
      if (response.ok) {
        await refresh();
        window.dispatchEvent(new Event("pretty-parcel-wishlist-updated"));
        trackClientEvent({
          eventType: "wishlist",
          path: `/products/${productName}`,
          label: "wishlist_add",
          metadata: { productId, category }
        });
      }
    } catch (error) {
      console.error("[ProductActions] wishlist failed", error);
      setMessage("We couldn't update your wishlist. Please try again.");
    }
  };

  return (
    <div className="space-y-5">
      <div className="inline-flex items-center rounded-full border border-white/70 bg-white/90 p-2 shadow-card">
        <button
          type="button"
          onClick={() => setQuantity((value) => Math.max(1, value - 1))}
          className="rounded-full p-2 text-rosewood"
          aria-label="Decrease quantity"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="min-w-10 text-center text-sm font-semibold text-cocoa">{quantity}</span>
        <button
          type="button"
          onClick={() => setQuantity((value) => value + 1)}
          className="rounded-full p-2 text-rosewood"
          aria-label="Increase quantity"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={handleAddToCart} disabled={pending} className="button-primary gap-2">
          <ShoppingBag className="h-4 w-4" />
          {pending ? "Adding..." : "Add to cart"}
        </button>
        <button type="button" onClick={handleWishlist} className="button-secondary gap-2">
          <Heart className="h-4 w-4" />
          Save to wishlist
        </button>
      </div>

      {message ? <p className="text-sm font-medium text-rosewood">{message}</p> : null}
    </div>
  );
}
