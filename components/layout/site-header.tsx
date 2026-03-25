"use client";

import Link from "next/link";
import { Heart, Menu, ShoppingBag, Sparkles, User } from "lucide-react";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { useBranding } from "@/components/providers/brand-provider";
import { formatCustomerLevel } from "@/lib/utils";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Shop" },
  { href: "/cart", label: "Cart" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/orders", label: "Orders" }
];

export function SiteHeader() {
  const { user, setUser, refresh } = useAuth();
  const { branding } = useBranding();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const syncCartCount = () => {
      fetch("/api/cart", {
        cache: "no-store",
        credentials: "include",
        headers: { Accept: "application/json" }
      })
        .then(async (response) => {
          const raw = await response.text();
          return raw ? JSON.parse(raw) : {};
        })
        .then((data) => {
          const items = Array.isArray(data?.items ?? data?.data?.items) ? (data?.items ?? data?.data?.items) : [];
          setCartCount(items.reduce((sum: number, item: { quantity?: number }) => sum + (item?.quantity ?? 0), 0));
        })
        .catch(() => setCartCount(0));
    };

    const handleWishlistRefresh = () => {
      void refresh();
    };

    syncCartCount();
    window.addEventListener("pretty-parcel-cart-updated", syncCartCount);
    window.addEventListener("pretty-parcel-wishlist-updated", handleWishlistRefresh);

    return () => {
      window.removeEventListener("pretty-parcel-cart-updated", syncCartCount);
      window.removeEventListener("pretty-parcel-wishlist-updated", handleWishlistRefresh);
    };
  }, [user, refresh]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
      headers: { Accept: "application/json" }
    });
    setUser(null);
    setCartCount(0);
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-white/65 backdrop-blur-xl">
      <div className="section-shell flex items-center justify-between gap-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          {branding?.logoUrl ? (
            <div className="story-ring flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-white text-berry">
              <img src={branding.logoUrl} alt="The Pretty Parcel logo" className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="story-ring flex h-11 w-11 items-center justify-center rounded-full bg-white text-berry">
              <Sparkles className="h-5 w-5" />
            </div>
          )}
          <div>
            <p className="font-serif text-2xl leading-none text-cocoa">The Pretty Parcel</p>
            <p className="text-[11px] tracking-[0.18em] text-rosewood/70">alot of 💗 by prachi</p>
            {user && user.role !== "admin" ? (
              <p className="mt-1 text-[11px] font-semibold tracking-[0.12em] text-pink-600/80">
                {formatCustomerLevel(user.level ?? 1)} 💖
              </p>
            ) : null}
          </div>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm font-medium text-rosewood transition hover:text-cocoa">
              {item.label}
            </Link>
          ))}
          {user?.role === "admin" ? (
            <Link href="/admin" className="button-secondary !py-2">
              Admin
            </Link>
          ) : null}
        </nav>

        <div className="flex items-center gap-2 lg:hidden">
          <Link href="/cart" className="relative rounded-full bg-white/90 p-3 text-rosewood shadow-card">
            <ShoppingBag className="h-4 w-4" />
            {cartCount ? (
              <span className="absolute -right-1 -top-1 rounded-full bg-berry px-1.5 text-[10px] text-white">
                {cartCount}
              </span>
            ) : null}
          </Link>
          <Link href={user ? "/account" : "/login"} className="rounded-full bg-white/90 p-3 text-rosewood shadow-card">
            <User className="h-4 w-4" />
          </Link>
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/wishlist" className="relative rounded-full bg-white/90 p-3 text-rosewood shadow-card">
            <Heart className="h-4 w-4" />
            {user?.wishlist?.length ? (
              <span className="absolute -right-1 -top-1 rounded-full bg-berry px-1.5 text-[10px] text-white">
                {user.wishlist.length}
              </span>
            ) : null}
          </Link>
          <Link href="/cart" className="relative rounded-full bg-white/90 p-3 text-rosewood shadow-card">
            <ShoppingBag className="h-4 w-4" />
            {cartCount ? (
              <span className="absolute -right-1 -top-1 rounded-full bg-berry px-1.5 text-[10px] text-white">
                {cartCount}
              </span>
            ) : null}
          </Link>
          {user ? (
            <div className="flex items-center gap-3">
              <Link href="/account" className="rounded-full bg-white/90 p-3 text-rosewood shadow-card">
                <User className="h-4 w-4" />
              </Link>
              <button onClick={handleLogout} className="button-secondary !py-2">
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="button-secondary !py-2">
                Login
              </Link>
              <Link href="/signup" className="button-primary !py-2">
                Create account
              </Link>
            </div>
          )}
        </div>

        <button
          className="rounded-full bg-white/90 p-3 text-rosewood shadow-card lg:hidden"
          onClick={() => setMenuOpen((value) => !value)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <div
        className={cn(
          "section-shell overflow-hidden transition-all lg:hidden",
          menuOpen ? "max-h-[420px] pb-5" : "max-h-0"
        )}
      >
        <div className="glass-panel mb-4 rounded-[1.75rem] p-5">
          <div className="flex flex-col gap-4">
            {user && user.role !== "admin" ? (
              <div className="rounded-[1rem] bg-rosewater px-4 py-3 text-sm font-semibold text-rosewood">
                {formatCustomerLevel(user.level ?? 1)} 💖
              </div>
            ) : null}
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-rosewood"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {user?.role === "admin" ? (
              <Link href="/admin" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-rosewood">
                Admin
              </Link>
            ) : null}
            {user ? (
              <button onClick={handleLogout} className="button-secondary">
                Logout
              </button>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <Link href="/login" onClick={() => setMenuOpen(false)} className="button-secondary">
                  Login
                </Link>
                <Link href="/signup" onClick={() => setMenuOpen(false)} className="button-primary">
                  Create account
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
