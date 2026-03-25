import Link from "next/link";

export default function NotFound() {
  return (
    <div className="section-shell py-16">
      <div className="glass-panel rounded-[2rem] p-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rosewood/70">404</p>
        <h1 className="mt-3 font-serif text-4xl text-cocoa">This pretty parcel is missing.</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-rosewood/80">
          The page you&apos;re looking for may have moved, expired, or never made it to the gifting shelf.
        </p>
        <Link href="/" className="button-primary mt-6">
          Go back home
        </Link>
      </div>
    </div>
  );
}
