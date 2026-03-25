"use client";

import Link from "next/link";
import { Instagram, MessageCircle, X } from "lucide-react";
import { useState } from "react";

export function ChatbotWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50 md:bottom-6 md:right-6">
      {open ? (
        <div className="glass-panel mb-3 w-[min(22rem,calc(100vw-2rem))] rounded-[2rem] p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-serif text-2xl text-cocoa">Custom Order</p>
              <p className="text-xs uppercase tracking-[0.25em] text-rosewood/70">Instagram and gift assistant</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-full bg-white/80 p-2 text-rosewood">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 rounded-[1.5rem] bg-white/80 p-4 text-sm leading-7 text-rosewood/90">
            <p className="font-medium text-cocoa">For customized gifts, contact us on Instagram.</p>
            <p className="mt-3 text-sm text-rosewood/80">
              Share your occasion, preferred colors, and personalization ideas there and we&apos;ll guide you.
            </p>
            <Link
              href="https://www.instagram.com/theprettyparcel._/"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-pink-700"
            >
              <Instagram className="h-4 w-4" />
              @theprettyparcel._
            </Link>
          </div>
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="button-primary relative z-50 min-h-[48px] gap-2 shadow-glow"
      >
        <MessageCircle className="h-4 w-4" />
        Custom Order 💖
      </button>
    </div>
  );
}
