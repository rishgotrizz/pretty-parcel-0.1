"use client";

import { BellRing, Percent } from "lucide-react";
import { useEffect, useState } from "react";

import { useToast } from "@/components/providers/toast-provider";

type CampaignSettings = {
  enableNotification: boolean;
  notificationRewardCode: string;
  notificationRewardType: "percentage" | "flat";
  notificationRewardValue: string;
  notificationRewardMinOrderValue: string;
};

const defaultState: CampaignSettings = {
  enableNotification: true,
  notificationRewardCode: "",
  notificationRewardType: "flat",
  notificationRewardValue: "",
  notificationRewardMinOrderValue: ""
};

export function CampaignSettingsPanel() {
  const [settings, setSettings] = useState<CampaignSettings>(defaultState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { pushToast } = useToast();

  useEffect(() => {
    async function loadCampaignSettings() {
      try {
        const response = await fetch("/api/admin/settings/campaign", {
          credentials: "include",
          headers: { Accept: "application/json" }
        });
        const raw = await response.text();
        const data = raw ? JSON.parse(raw) : {};
        const payload = data?.data ?? data ?? {};

        setSettings({
          enableNotification: Boolean(payload?.enableNotification ?? true),
          notificationRewardCode:
            typeof payload?.notificationRewardCode === "string" ? payload.notificationRewardCode : "",
          notificationRewardType: payload?.notificationRewardType === "percentage" ? "percentage" : "flat",
          notificationRewardValue: payload?.notificationRewardValue ? String(payload.notificationRewardValue) : "",
          notificationRewardMinOrderValue: payload?.notificationRewardMinOrderValue ? String(payload.notificationRewardMinOrderValue) : ""
        });
      } catch (error) {
        console.error("[CampaignSettingsPanel] load failed", error);
        pushToast("Could not load campaign settings.", "error");
      } finally {
        setLoading(false);
      }
    }

    void loadCampaignSettings();
  }, [pushToast]);

  async function saveSettings() {
    try {
      setSaving(true);
      const response = await fetch("/api/admin/settings/campaign", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          enableNotification: settings.enableNotification,
          notificationRewardCode: settings.notificationRewardCode,
          notificationRewardType: settings.notificationRewardType,
          notificationRewardValue: Number(settings.notificationRewardValue || 0),
          notificationRewardMinOrderValue: Number(settings.notificationRewardMinOrderValue || 0)
        })
      });
      const raw = await response.text();
      const data = raw ? JSON.parse(raw) : {};
      const payload = data?.data ?? data ?? {};

      if (!response.ok || data?.success === false) {
        pushToast(data?.error ?? "Could not save campaign settings.", "error");
        return;
      }

      setSettings({
        enableNotification: Boolean(payload?.enableNotification ?? settings.enableNotification),
        notificationRewardCode:
          typeof payload?.notificationRewardCode === "string" ? payload.notificationRewardCode : "",
        notificationRewardType: payload?.notificationRewardType === "percentage" ? "percentage" : "flat",
        notificationRewardValue: payload?.notificationRewardValue ? String(payload.notificationRewardValue) : "",
        notificationRewardMinOrderValue: payload?.notificationRewardMinOrderValue ? String(payload.notificationRewardMinOrderValue) : ""
      });
      pushToast("Campaign settings saved.", "success");
    } catch (error) {
      console.error("[CampaignSettingsPanel] save failed", error);
      pushToast("Could not save campaign settings.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="glass-panel rounded-[2rem] border border-white/70 p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-berry">
          <Percent className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rosewood/70">Coupon + notification panel</p>
          <h2 className="mt-2 font-serif text-3xl text-cocoa">Notification reward controls</h2>
          <p className="mt-2 text-sm leading-6 text-rosewood/75">This reward is separate from your regular store coupons and discount library.</p>
        </div>
      </div>

      {loading ? <p className="mt-6 text-sm text-rosewood/70">Loading campaign settings...</p> : null}

      {!loading ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="md:col-span-2 flex items-center justify-between rounded-[1.5rem] border border-pink-100 bg-white/90 px-4 py-4">
            <div className="flex items-center gap-3">
              <BellRing className="h-5 w-5 text-berry" />
              <div>
                <p className="text-sm font-semibold text-cocoa">Enable notifications</p>
                <p className="text-xs text-rosewood/70">Control whether customers can claim the notification reward and receive campaigns.</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.enableNotification}
              onChange={(event) => setSettings((current) => ({ ...current, enableNotification: event.target.checked }))}
              className="h-5 w-5 rounded border-pink-200 text-berry focus:ring-pink-200"
            />
          </label>

          <div>
            <label className="mb-2 block text-sm font-semibold text-cocoa">Reward coupon code</label>
            <input
              value={settings.notificationRewardCode}
              onChange={(event) =>
                setSettings((current) => ({ ...current, notificationRewardCode: event.target.value.toUpperCase() }))
              }
              placeholder="NOTIFYGIFT"
              className="w-full rounded-[1rem] border border-pink-100 bg-white/90 px-4 py-3 text-sm outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-cocoa">Reward type</label>
            <select
              value={settings.notificationRewardType}
              onChange={(event) =>
                setSettings((current) => ({ ...current, notificationRewardType: event.target.value as "percentage" | "flat" }))
              }
              className="w-full rounded-[1rem] border border-pink-100 bg-white/90 px-4 py-3 text-sm outline-none"
            >
              <option value="percentage">Percentage</option>
              <option value="flat">Flat</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-cocoa">Reward value</label>
            <input
              type="number"
              min="0"
              value={settings.notificationRewardValue}
              onChange={(event) =>
                setSettings((current) => ({ ...current, notificationRewardValue: event.target.value }))
              }
              placeholder="100"
              className="w-full rounded-[1rem] border border-pink-100 bg-white/90 px-4 py-3 text-sm outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-cocoa">Minimum order value</label>
            <input
              type="number"
              min="0"
              value={settings.notificationRewardMinOrderValue}
              onChange={(event) =>
                setSettings((current) => ({ ...current, notificationRewardMinOrderValue: event.target.value }))
              }
              placeholder="999"
              className="w-full rounded-[1rem] border border-pink-100 bg-white/90 px-4 py-3 text-sm outline-none"
            />
          </div>

          <div className="rounded-[1.25rem] bg-rosewater/80 p-4 text-sm leading-6 text-rosewood/80 md:col-span-2">
            {settings.notificationRewardCode && Number(settings.notificationRewardValue || 0) > 0 ? (
              <>
                Customers who allow notifications will receive{" "}
                <span className="font-semibold text-cocoa">{settings.notificationRewardCode}</span> for{" "}
                <span className="font-semibold text-cocoa">
                  {settings.notificationRewardType === "percentage"
                    ? `${settings.notificationRewardValue}% off`
                    : `Rs.${settings.notificationRewardValue} off`}
                </span>
                {Number(settings.notificationRewardMinOrderValue || 0) > 0
                  ? ` on orders above Rs.${settings.notificationRewardMinOrderValue}.`
                  : "."}
              </>
            ) : (
              "You can leave the reward fields empty if you only want to enable notifications without granting a coupon."
            )}
          </div>

          <button type="button" onClick={() => void saveSettings()} disabled={saving} className="button-primary md:col-span-2">
            {saving ? "Saving reward..." : "Save notification reward"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
