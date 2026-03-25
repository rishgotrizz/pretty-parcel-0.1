"use client";

import { Heart } from "lucide-react";
import { useEffect, useRef } from "react";

import { Card } from "@/components/shared/card";

export type ReviewCard = {
  _id: string;
  name: string;
  text: string;
  imageUrl?: string;
};

export function ReviewsSection({ reviews, loading = false }: { reviews: ReviewCard[]; loading?: boolean }) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!scrollerRef.current || reviews.length < 2 || window.innerWidth >= 768) {
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

  return (
    <section className="isolate mt-24 pb-28 pt-3 md:mt-20 md:pb-16 md:pt-0">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 text-center sm:mb-10 md:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-pink-700/70">Customer Love 💖</p>
          <h2 className="text-2xl font-serif leading-tight break-words text-slate-900 sm:text-3xl md:text-4xl">
            Kind words from thoughtful gift senders.
          </h2>
          <p className="mx-auto max-w-2xl text-sm leading-7 text-slate-500 sm:text-base md:mx-0">
            Real moments from customers who trusted The Pretty Parcel for birthdays, surprises, and handmade keepsakes.
          </p>
        </div>

        {loading ? (
          <div className="flex gap-4 overflow-x-auto pb-4 pr-4 scroll-smooth snap-x snap-mandatory overscroll-x-contain [scrollbar-width:none] [scroll-padding-inline:1rem] touch-pan-x [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:pr-0">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="min-w-[85%] max-w-[90%] flex-shrink-0 snap-start animate-pulse rounded-2xl border border-pink-100/80 bg-white p-4 shadow-md md:min-w-0 md:max-w-none"
              >
                <div className="h-4 w-24 rounded-full bg-pink-100" />
                <div className="mt-5 h-4 w-full rounded-full bg-pink-100" />
                <div className="mt-3 h-4 w-4/5 rounded-full bg-pink-100" />
                <div className="mt-6 h-40 rounded-xl bg-pink-100/70" />
                <div className="mt-5 h-4 w-28 rounded-full bg-pink-100" />
              </div>
            ))}
          </div>
        ) : reviews.length ? (
          <div
            ref={scrollerRef}
            className="flex gap-4 overflow-x-auto pb-4 pr-4 scroll-smooth snap-x snap-mandatory overscroll-x-contain [scrollbar-width:none] [scroll-padding-inline:1rem] touch-pan-x [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:pr-0"
          >
            {reviews.map((review) => (
              <Card
                key={review._id}
                className="min-w-[85%] max-w-[90%] flex-shrink-0 snap-start rounded-2xl border border-pink-100/80 bg-gradient-to-b from-white to-rosewater/80 p-4 shadow-md md:min-w-0 md:max-w-none md:p-5"
              >
                <div className="flex items-center gap-2 text-pink-600">
                  <Heart className="h-4 w-4 fill-current" />
                  <Heart className="h-4 w-4 fill-current" />
                  <Heart className="h-4 w-4 fill-current" />
                </div>
                <p className="mt-4 break-words text-sm leading-7 text-rosewood/85">{review.text}</p>
                {review.imageUrl ? (
                  <img
                    src={review.imageUrl}
                    alt={`${review.name} review`}
                    className="mt-5 h-40 w-full rounded-xl object-cover"
                  />
                ) : null}
                <p className="mt-5 break-words font-semibold text-cocoa">{review.name}</p>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="rounded-2xl border border-pink-100/80 bg-gradient-to-b from-white to-rosewater/80 p-6 text-center shadow-md">
            <p className="font-serif text-2xl text-cocoa">No reviews yet. Be the first!</p>
            <p className="mt-3 text-sm leading-7 text-rosewood/75">
              Once customers start sharing their gifting moments, they&apos;ll appear here in a beautiful scrolling gallery.
            </p>
          </Card>
        )}
      </div>
    </section>
  );
}
