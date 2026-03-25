import { Heart } from "lucide-react";

import { Card } from "@/components/shared/card";

export type ReviewCard = {
  _id: string;
  name: string;
  text: string;
  imageUrl?: string;
};

export function ReviewsSection({ reviews }: { reviews: ReviewCard[] }) {
  if (!reviews.length) {
    return null;
  }

  return (
    <section className="section-shell mt-16 sm:mt-24">
      <div className="mb-8 space-y-3 sm:mb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-pink-700/70">Customer Love 💖</p>
        <h2 className="font-serif text-4xl text-slate-900 sm:text-5xl">Kind words from thoughtful gift senders.</h2>
        <p className="max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
          Real moments from customers who trusted The Pretty Parcel for birthdays, surprises, and handmade keepsakes.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {reviews.map((review) => (
          <Card key={review._id} className="rounded-[2rem] border border-pink-100/80 bg-white/85 p-5 shadow-[var(--shadow-card)]">
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
