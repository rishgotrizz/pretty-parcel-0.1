"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[AppRouterError]", error);
  }, [error]);

  return (
    <div className="section-shell py-16">
      <div className="glass-panel rounded-[2rem] p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rosewood/70">
          Something went wrong
        </p>
        <h2 className="mt-3 font-serif text-4xl text-cocoa">
          The Pretty Parcel hit an unexpected issue.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-rosewood/80">
          We&apos;ve logged the error. Try refreshing this view, and if it keeps happening, restart the dev server
          after clearing the current `.next` build output.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button type="button" onClick={reset} className="button-primary">
            Try again
          </button>
          <a href="/" className="button-secondary">
            Back to home
          </a>
        </div>
      </div>
    </div>
  );
}
