"use client";

import Link from "next/link";
import { Gift, Instagram, Sparkles, Star } from "lucide-react";

import { useBranding } from "@/components/providers/brand-provider";
import { Button } from "@/components/shared/button";
import { Card } from "@/components/shared/card";
import { FlashSaleTimer } from "@/components/shared/flash-sale-timer";

export function HeroSection({ flashSaleEndsAt }: { flashSaleEndsAt?: string }) {
  const { branding } = useBranding();

  return (
    <section className="pt-2 sm:pt-8">
      <div className="grid items-center gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
        <div className="animate-rise space-y-6 sm:space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-pink-100 bg-white/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-pink-700 shadow-sm">
            <Instagram className="h-4 w-4" />
            Instagram-born, website-ready gifting
          </div>
          <div className="space-y-4">
            <h1 className="max-w-3xl font-serif text-4xl leading-[0.94] text-slate-900 sm:text-6xl lg:text-7xl">
              Premium gifting, wrapped in soft pink elegance.
            </h1>
            <p className="max-w-xl text-sm leading-7 text-slate-500 sm:text-lg sm:leading-8">
              Handmade bouquets, portraits, keychains, scrapbooks, and keepsakes designed for thoughtful moments and
              premium unboxing joy.
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap sm:items-center">
            <Button href="/products" className="w-full sm:w-auto">
              Explore gifts
            </Button>
            <Button href="/terms" variant="secondary" className="w-full sm:w-auto">
              Policies
            </Button>
            {flashSaleEndsAt ? <FlashSaleTimer endsAt={flashSaleEndsAt} /> : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Custom gifting", icon: Gift },
              { label: "Premium finish", icon: Star },
              { label: "Fast support", icon: Sparkles }
            ].map((item) => (
              <Card key={item.label} className="rounded-[1.5rem] border border-white/70 bg-white/75 p-4">
                <item.icon className="h-5 w-5 text-pink-600" />
                <p className="mt-3 text-sm font-medium text-slate-700">{item.label}</p>
              </Card>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-6 rounded-[2.5rem] bg-gradient-to-br from-pink-300/30 via-white/70 to-pink-100/50 blur-3xl" />
          <Card className="relative overflow-hidden rounded-[2.5rem] p-4 sm:p-5">
            <img
              src={branding.heroImageUrl || "/hero-pretty-parcel.svg"}
              alt="The Pretty Parcel hero"
              className="h-[360px] w-full rounded-[2rem] object-cover sm:h-[440px] lg:h-[520px]"
            />
            <div className="mt-4 rounded-[1.75rem] border border-white/80 bg-white/90 p-5 shadow-sm sm:absolute sm:bottom-8 sm:left-8 sm:mt-0 sm:max-w-xs">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-pink-700/70">Store mood</p>
              <p className="mt-2 font-serif text-2xl text-slate-900">{branding.storeMoodText}</p>
            </div>
          </Card>
        </div>
      </div>
      {branding.whatsNewText ? (
        <div className="mt-6 rounded-[1.5rem] border border-pink-100/80 bg-white/80 px-5 py-4 text-sm leading-7 text-rosewood/80 shadow-sm">
          <span className="mr-2 font-semibold uppercase tracking-[0.22em] text-pink-700/70">What&apos;s New</span>
          {branding.whatsNewText}
        </div>
      ) : null}
    </section>
  );
}
