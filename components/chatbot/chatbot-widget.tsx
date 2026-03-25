"use client";

import Link from "next/link";
import { Instagram, MessageCircle, X } from "lucide-react";
import { useState } from "react";

export function ChatbotWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 md:inset-x-auto md:right-6 md:bottom-6">
      {open ? (
        <div className="pointer-events-auto glass-panel mb-3 ml-auto w-full max-w-[22rem] rounded-[2rem] p-5 shadow-[var(--shadow-card)]">
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
        className="pointer-events-auto button-primary relative z-50 ml-auto min-h-[48px] w-full justify-center gap-2 shadow-glow md:w-auto"
      >
        <MessageCircle className="h-4 w-4" />
        Custom Order 💖
      </button>
    </div>
  );
}
