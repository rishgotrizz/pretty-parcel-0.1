"use client";

import Link from "next/link";
import { Instagram, MessageCircle, X } from "lucide-react";
import { useState } from "react";

export function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("Need help choosing a handmade gift? Ask me anything.");
  const [pending, setPending] = useState(false);

  const handleSend = async () => {
    if (!message.trim() || pending) {
      return;
    }

    try {
      setPending(true);
      console.debug("[ChatbotWidget] sending message");

      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include",
        body: JSON.stringify({ message })
      });
      const raw = await response.text();
      const data = raw ? JSON.parse(raw) : {};

      if (!response.ok) {
        setReply(data.error ?? "I can help with product ideas, shipping, coupons, and order tracking.");
        return;
      }

      setReply(data.reply ?? "I can help with product ideas, shipping, coupons, and order tracking.");
      setMessage("");
    } catch (error) {
      console.error("[ChatbotWidget] send failed", error);
      setReply("I couldn't respond right now. Please try again in a moment.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open ? (
        <div className="glass-panel w-[min(22rem,calc(100vw-2rem))] rounded-[2rem] p-5">
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
            <p>{reply}</p>
            <div className="mt-4 rounded-[1.25rem] bg-rosewater/90 p-4">
              <p className="font-medium text-cocoa">For fully customized gifts, contact us on Instagram.</p>
              <Link
                href="https://www.instagram.com/theprettyparcel._/"
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-pink-700"
              >
                <Instagram className="h-4 w-4" />
                @theprettyparcel._
              </Link>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Ask about bouquets, offers, or shipping..."
              className="flex-1 rounded-full border border-white/70 bg-white/90 px-4 py-3 text-sm outline-none"
            />
            <button type="button" onClick={handleSend} className="button-primary !px-4" disabled={pending}>
              {pending ? "..." : "Send"}
            </button>
          </div>
        </div>
      ) : null}
      <button type="button" onClick={() => setOpen((value) => !value)} className="button-primary mt-4 gap-2 shadow-glow">
        <MessageCircle className="h-4 w-4" />
        Custom Order 💖
      </button>
    </div>
  );
}
