"use client";

import { Bell, Gift } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";

const PROMPT_KEY = "pretty-parcel-notification-prompted";

async function registerNotificationWorker() {
  if (!("serviceWorker" in navigator)) {
    return null;
  }

  return navigator.serviceWorker.register("/sw.js");
}

export function NotificationCenter() {
  const { user } = useAuth();
  const { pushToast } = useToast();
  const [visible, setVisible] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const canPrompt = useMemo(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return (
      Boolean(user) &&
      "Notification" in window &&
      Notification.permission === "default" &&
      window.localStorage.getItem(PROMPT_KEY) !== "true"
    );
  }, [user]);

  useEffect(() => {
    setVisible(canPrompt);
  }, [canPrompt]);

  useEffect(() => {
    if (!user || typeof window === "undefined" || Notification.permission !== "granted") {
      return;
    }

    let cancelled = false;
    let intervalId: number | undefined;

    async function startPolling() {
      const registration = await registerNotificationWorker();
      if (!registration || cancelled) {
        return;
      }

      const poll = async () => {
        try {
          const response = await fetch("/api/notifications/poll", {
            cache: "no-store",
            credentials: "include",
            headers: { Accept: "application/json" }
          });
          const raw = await response.text();
          const data = raw ? JSON.parse(raw) : {};
          const notifications = Array.isArray(data.notifications) ? data.notifications : [];

          notifications.forEach((notification: { message: string }) => {
            registration.showNotification("The Pretty Parcel", {
              body: notification.message,
              icon: "/favicon.ico",
              data: { url: "/" }
            });
          });
        } catch (error) {
          console.error("[NotificationCenter] poll failed", error);
        }
      };

      await poll();
      intervalId = window.setInterval(() => {
        void poll();
      }, 60000);
    }

    void startPolling();

    return () => {
      cancelled = true;
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [user]);

  async function enableNotifications() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    try {
      setRequesting(true);
      const permission = await Notification.requestPermission();
      window.localStorage.setItem(PROMPT_KEY, "true");
      setVisible(false);

      if (permission !== "granted") {
        pushToast("Notifications were not enabled.", "info");
        return;
      }

      await registerNotificationWorker();

      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" }
      });
      const raw = await response.text();
      const data = raw ? JSON.parse(raw) : {};

      if (!response.ok) {
        pushToast(data.error ?? "Could not enable notifications.", "error");
        return;
      }

      pushToast("You received Rs.10 reward coupon!", "success");
    } catch (error) {
      console.error("[NotificationCenter] permission request failed", error);
      pushToast("Could not enable notifications.", "error");
    } finally {
      setRequesting(false);
    }
  }

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-4 z-[60] max-w-sm rounded-[1.75rem] border border-pink-200 bg-white/95 p-5 shadow-[var(--shadow-card)] backdrop-blur sm:left-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-rosewater text-pink-600">
          <Bell className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-cocoa">Allow notifications and get Rs.10 reward</p>
          <p className="mt-2 text-sm leading-6 text-rosewood/75">
            Enable notifications once to hear about offers, drops, and receive your `WELCOME10` coupon.
          </p>
        </div>
      </div>
      <button type="button" onClick={() => void enableNotifications()} disabled={requesting} className="button-primary mt-4 w-full">
        <Gift className="h-4 w-4" />
        {requesting ? "Enabling..." : "Allow Notifications"}
      </button>
    </div>
  );
}
