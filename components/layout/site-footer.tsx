import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-white/60 bg-white/50">
      <div className="section-shell grid gap-10 py-12 md:grid-cols-[1.5fr_repeat(2,1fr)]">
        <div className="space-y-4">
          <p className="font-serif text-3xl text-cocoa">The Pretty Parcel</p>
          <p className="max-w-md text-sm leading-7 text-rosewood/80">
            A handmade gifting website for bouquets, custom portraits, keychains, scrapbooks, and premium keepsakes
            crafted with a soft feminine touch.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-rosewood/70">Shop</p>
          <div className="mt-4 flex flex-col gap-3 text-sm text-rosewood">
            <Link href="/products">All products</Link>
            <Link href="/cart">Cart</Link>
            <Link href="/wishlist">Wishlist</Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-rosewood/70">Account</p>
          <div className="mt-4 flex flex-col gap-3 text-sm text-rosewood">
            <Link href="/login">Login</Link>
            <Link href="/signup">Sign up</Link>
            <Link href="/orders">Track orders</Link>
            <Link href="/terms">Terms & policies</Link>
            <Link href="/privacy-policy">Privacy policy</Link>
            <Link href="/contact">Contact us</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
