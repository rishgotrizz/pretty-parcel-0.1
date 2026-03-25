"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/shared/button";
import { Card } from "@/components/shared/card";
import { Input } from "@/components/shared/input";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const { setUser, refresh } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/";
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const { pushToast } = useToast();

  const isLogin = mode === "login";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (pending) {
      return;
    }

    setPending(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    console.debug("[AuthForm] submitting", {
      mode,
      email: typeof payload.email === "string" ? payload.email : undefined
    });

    try {
      const response = await fetch(`/api/auth/${isLogin ? "login" : "register"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      });

      const raw = await response.text();
      const data = raw ? JSON.parse(raw) : {};

      console.debug("[AuthForm] response", {
        mode,
        ok: response.ok,
        status: response.status
      });

      if (!response.ok) {
        setError(data.error ?? "Something went wrong.");
        pushToast(data.error ?? "Something went wrong.", "error");
        return;
      }

      setUser(data.user ?? null);
      await refresh();
      pushToast(isLogin ? "Logged in successfully." : "Account created successfully.", "success");
      router.push(nextPath);
      router.refresh();
    } catch (error) {
      console.error("[AuthForm] submit failed", error);
      setError("We couldn't submit the form. Please try again.");
      pushToast("We couldn't submit the form. Please try again.", "error");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="order-2 space-y-4 px-2 text-center lg:order-1 lg:px-0 lg:text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-pink-600/80">
          {isLogin ? "Welcome back" : "Premium gifting account"}
        </p>
        <h1 className="font-serif text-4xl leading-[1.02] text-slate-900 sm:text-5xl">
          {isLogin ? "Step back into your curated gift cart." : "Create an elegant account for every special order."}
        </h1>
        <p className="max-w-xl text-base leading-8 text-slate-500">
          {isLogin
            ? "Login to manage orders, save wishlists, and keep your gifting journey beautifully organised."
            : "Sign up to save favorites, track each parcel, and unlock a smoother handmade gifting experience."}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            "Soft pink premium design",
            "Saved wishlist and synced cart",
            "Order tracking and invoices",
            "Personal recommendations"
          ].map((item) => (
            <div key={item} className="rounded-[1.25rem] border border-white/70 bg-white/70 px-4 py-3 text-sm font-medium text-slate-600 shadow-sm">
              {item}
            </div>
          ))}
        </div>
      </div>

      <Card className="order-1 rounded-[2rem] border border-pink-100/80 bg-white/90 p-7 shadow-[var(--shadow-soft)] sm:p-9 lg:order-2">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-pink-600/80">
          {isLogin ? "Login" : "Sign up"}
        </p>
        <h2 className="mt-3 font-serif text-3xl text-slate-900 sm:text-4xl">
          {isLogin ? "Your gifting profile" : "Join The Pretty Parcel"}
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-500">
          A clean, premium shopping space for thoughtful handmade gifting.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {!isLogin ? <Input name="name" required placeholder="Full name" /> : null}
          <Input name="email" type="email" required placeholder="Email address" />
          <Input name="password" type="password" required minLength={6} placeholder="Password" />
          {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">{error}</p> : null}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Please wait..." : isLogin ? "Login" : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-sm text-slate-500">
          {isLogin ? "New here?" : "Already have an account?"}{" "}
          <Link href={isLogin ? "/signup" : "/login"} className="font-semibold text-pink-600 hover:text-pink-700">
            {isLogin ? "Create one" : "Login"}
          </Link>
        </p>
      </Card>
    </div>
  );
}
