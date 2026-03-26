"use client";

import { Bell, Gift } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";

const PROMPT_KEY = "pretty-parcel-notification-prompted";

type RewardSettings = {
  enableNotification: boolean;
  notificationRewardCode: string;
  notificationRewardType: "percentage" | "flat";
  notificationRewardValue: number;
  notificationRewardMinOrderValue: number;
};

const defaultRewardSettings: RewardSettings = {
  enableNotification: true,
  notificationRewardCode: "",
  notificationRewardType: "flat",
  notificationRewardValue: 0,
  notificationRewardMinOrderValue: 0
};

function getNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }

  return Notification.permission;
}

async function registerNotificationWorker() {
  if (!("serviceWorker" in navigator)) {
    return null;
  }

  return navigator.serviceWorker.register("/sw.js");
}

export function NotificationCenter() {
  const { user, refresh } = useAuth();
  const { pushToast } = useToast();
  const [visible, setVisible] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [rewardSettings, setRewardSettings] = useState<RewardSettings>(defaultRewardSettings);

  useEffect(() => {
    async function loadRewardSettings() {
      try {
        const response = await fetch("/api/settings", {
          credentials: "include",
          headers: { Accept: "application/json" },
          cache: "no-store"
        });
        const raw = await response.text();
        const data = raw ? JSON.parse(raw) : {};
        const payload = data?.data?.settings ?? data?.settings ?? {};

        setRewardSettings({
          enableNotification: Boolean(payload?.enableNotification ?? true),
          notificationRewardCode:
            typeof payload?.notificationRewardCode === "string" ? payload.notificationRewardCode : "",
          notificationRewardType:
            payload?.notificationRewardType === "percentage" ? "percentage" : "flat",
          notificationRewardValue: Number(payload?.notificationRewardValue ?? 0),
          notificationRewardMinOrderValue: Number(payload?.notificationRewardMinOrderValue ?? 0)
        });
      } catch (error) {
        console.error("[NotificationCenter] settings load failed", error);
        setRewardSettings(defaultRewardSettings);
      }
    }

    void loadRewardSettings();
  }, []);

  const rewardText = useMemo(() => {
    if (
      !rewardSettings.enableNotification ||
      rewardSettings.notificationRewardValue <= 0 ||
      !rewardSettings.notificationRewardCode
    ) {
      return null;
    }

    if (rewardSettings.notificationRewardType === "percentage") {
      return `${rewardSettings.notificationRewardValue}% off coupon`;
    }

    return `Rs.${rewardSettings.notificationRewardValue} coupon`;
  }, [rewardSettings]);

  const canPrompt = useMemo(() => {
    if (typeof window === "undefined") {
      return false;
    }

    if (!user) {
      return false;
    }

    const permission = getNotificationPermission();
    if (permission === "unsupported") {
      return false;
    }

    if (!rewardSettings.enableNotification) {
      return false;
    }

    return (
      !user.notificationRewardClaimed &&
      (
        (permission === "default" && window.localStorage.getItem(PROMPT_KEY) !== "true") ||
        (permission === "granted" && !user.notificationEnabled)
      )
    );
  }, [rewardSettings.enableNotification, user]);

  useEffect(() => {
    setVisible(canPrompt);
  }, [canPrompt]);

  useEffect(() => {
    if (!user || typeof window === "undefined" || getNotificationPermission() !== "granted") {
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
          const notifications = Array.isArray(data?.notifications ?? data?.data?.notifications)
            ? (data?.notifications ?? data?.data?.notifications)
            : [];

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
      pushToast("Notifications are not supported in this browser.", "info");
      return;
    }

    try {
      setRequesting(true);
      const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();

      if (permission !== "granted") {
        window.localStorage.setItem(PROMPT_KEY, "true");
        setVisible(false);
        pushToast("Please allow notifications to receive reward.", "info");
        return;
      }

      await registerNotificationWorker();

      const response = await fetch("/api/reward-notification", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ permission })
      });
      const raw = await response.text();
      const data = raw ? JSON.parse(raw) : {};
      const payload = data?.data ?? data ?? {};
      window.localStorage.setItem(PROMPT_KEY, "true");
      setVisible(false);

      if (!response.ok || data?.success === false) {
        pushToast(data.error ?? "Could not enable notifications.", "error");
        return;
      }

      await refresh();
      if (payload?.alreadyClaimed || data?.alreadyClaimed) {
        pushToast("Your notification reward has already been claimed.", "info");
        return;
      }

      if (payload?.coupon?.code) {
        const valueLabel =
          payload?.coupon?.type === "percentage"
            ? `${payload?.coupon?.value ?? 0}% off`
            : `Rs.${payload?.coupon?.value ?? 0}`;
        pushToast(`Reward unlocked: ${payload.coupon.code} for ${valueLabel}.`, "success");
        return;
      }

      pushToast("Notifications enabled successfully.", "success");
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
          <p className="text-sm font-semibold text-cocoa">
            {rewardText ? `Enable notifications & get ${rewardText}` : "Enable notifications"}
          </p>
          <p className="mt-2 text-sm leading-6 text-rosewood/75">
            {rewardText && rewardSettings.notificationRewardCode
              ? `Turn on browser notifications to hear about offers, drops, and unlock your one-time ${rewardSettings.notificationRewardCode} reward.`
              : "Turn on browser notifications to hear about offers, drops, and new gift launches."}
          </p>
          {rewardSettings.notificationRewardMinOrderValue > 0 && rewardText ? (
            <p className="mt-2 text-xs font-medium text-rosewood/65">
              Valid on orders above Rs.{rewardSettings.notificationRewardMinOrderValue}.
            </p>
          ) : null}
        </div>
      </div>
      <button type="button" onClick={() => void enableNotifications()} disabled={requesting} className="button-primary mt-4 w-full">
        <Gift className="h-4 w-4" />
        {requesting ? "Checking permission..." : rewardText ? `Enable notifications & get ${rewardText}` : "Enable notifications"}
      </button>
    </div>
  );
}
