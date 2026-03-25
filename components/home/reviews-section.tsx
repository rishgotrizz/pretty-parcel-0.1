"use client";

import { ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { useEffect, useRef } from "react";

import { Card } from "@/components/shared/card";

export type ReviewCard = {
  _id: string;
  name: string;
  text: string;
  imageUrl?: string;
};

export function ReviewsSection({ reviews }: { reviews: ReviewCard[] }) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!scrollerRef.current || reviews.length < 2) {
      return;
    }

    const scroller = scrollerRef.current;
    const intervalId = window.setInterval(() => {
      const cardWidth = scroller.firstElementChild instanceof HTMLElement ? scroller.firstElementChild.offsetWidth + 24 : 320;
      const atEnd = scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 16;
      scroller.scrollTo({
        left: atEnd ? 0 : scroller.scrollLeft + cardWidth,
        behavior: "smooth"
      });
    }, 4500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [reviews.length]);

  if (!reviews.length) {
    return null;
  }

  const scrollByAmount = (direction: "left" | "right") => {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }

    const cardWidth = scroller.firstElementChild instanceof HTMLElement ? scroller.firstElementChild.offsetWidth + 24 : 320;
    scroller.scrollBy({
      left: direction === "left" ? -cardWidth : cardWidth,
      behavior: "smooth"
    });
  };

  return (
    <section className="section-shell mt-16 pb-10 sm:mt-24 sm:pb-16">
      <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-pink-700/70">Customer Love 💖</p>
          <h2 className="font-serif text-4xl text-slate-900 sm:text-5xl">Kind words from thoughtful gift senders.</h2>
          <p className="max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
            Real moments from customers who trusted The Pretty Parcel for birthdays, surprises, and handmade keepsakes.
          </p>
        </div>
        <div className="hidden items-center gap-3 sm:flex">
          <button type="button" onClick={() => scrollByAmount("left")} className="button-secondary !p-3">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => scrollByAmount("right")} className="button-secondary !p-3">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {reviews.map((review) => (
          <Card
            key={review._id}
            className="min-w-[84%] snap-start rounded-[2rem] border border-pink-100/80 bg-gradient-to-b from-white/95 to-rosewater/70 p-5 shadow-[var(--shadow-card)] sm:min-w-[420px]"
          >
            <div className="flex items-center gap-2 text-pink-600">
              <Heart className="h-4 w-4 fill-current" />
              <Heart className="h-4 w-4 fill-current" />
              <Heart className="h-4 w-4 fill-current" />
            </div>
            <p className="mt-4 text-sm leading-7 text-rosewood/85">{review.text}</p>
            {review.imageUrl ? (
              <img
                src={review.imageUrl}
                alt={`${review.name} review`}
                className="mt-5 h-44 w-full rounded-[1.5rem] object-cover"
              />
            ) : null}
            <p className="mt-5 font-semibold text-cocoa">{review.name}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
