"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const TRACKABLE_ELEMENTS = ["A", "BUTTON", "INPUT", "SELECT", "TEXTAREA"];

function getSessionId() {
  if (typeof window === "undefined") {
    return "";
  }

  const key = "pretty-parcel-session";
  const existing = window.sessionStorage.getItem(key);
  if (existing) {
    return existing;
  }
  const next = crypto.randomUUID();
  window.sessionStorage.setItem(key, next);
  return next;
}

export function trackClientEvent(event: Record<string, unknown>) {
  if (typeof window === "undefined") {
    return;
  }

  const payload = JSON.stringify({
    sessionId: getSessionId(),
    ...event
  });

  navigator.sendBeacon?.("/api/analytics/track", payload) ||
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      credentials: "include",
      body: payload,
      keepalive: true
    }).catch(() => null);
}

export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const startedAt = Date.now();
    trackClientEvent({
      eventType: "page_view",
      path: pathname,
      label: pathname
    });

    return () => {
      trackClientEvent({
        eventType: "time_spent",
        path: pathname,
        durationMs: Date.now() - startedAt
      });
    };
  }, [pathname]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const clickable = target.closest<HTMLElement>("[data-analytics-label], a, button, input, select, textarea");
      if (!clickable) {
        return;
      }

      if (!TRACKABLE_ELEMENTS.includes(clickable.tagName) && !clickable.dataset.analyticsLabel) {
        return;
      }

      const label =
        clickable.dataset.analyticsLabel ||
        clickable.getAttribute("aria-label") ||
        clickable.textContent?.trim()?.slice(0, 80) ||
        clickable.tagName.toLowerCase();

      trackClientEvent({
        eventType: "click",
        path: pathname,
        label,
        metadata: {
          tagName: clickable.tagName.toLowerCase()
        }
      });
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, [pathname]);

  return null;
}
