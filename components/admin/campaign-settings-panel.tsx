"use client";

import { BellRing, Percent } from "lucide-react";
import { useEffect, useState } from "react";

import { useToast } from "@/components/providers/toast-provider";

type CampaignSettings = {
  enableNotification: boolean;
  couponCode: string;
  discountType: "percentage" | "flat";
  discountValue: string;
  minOrderValue: string;
};

const defaultState: CampaignSettings = {
  enableNotification: true,
  couponCode: "",
  discountType: "percentage",
  discountValue: "",
  minOrderValue: ""
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
          couponCode: typeof payload?.couponCode === "string" ? payload.couponCode : "",
          discountType: payload?.discountType === "flat" ? "flat" : "percentage",
          discountValue: payload?.discountValue ? String(payload.discountValue) : "",
          minOrderValue: payload?.minOrderValue ? String(payload.minOrderValue) : ""
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
          couponCode: settings.couponCode,
          discountType: settings.discountType,
          discountValue: Number(settings.discountValue || 0),
          minOrderValue: Number(settings.minOrderValue || 0)
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
        couponCode: typeof payload?.couponCode === "string" ? payload.couponCode : "",
        discountType: payload?.discountType === "flat" ? "flat" : "percentage",
        discountValue: payload?.discountValue ? String(payload.discountValue) : "",
        minOrderValue: payload?.minOrderValue ? String(payload.minOrderValue) : ""
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
          <h2 className="mt-2 font-serif text-3xl text-cocoa">Campaign controls</h2>
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
                <p className="text-xs text-rosewood/70">Control whether admin campaigns can be sent to subscribers.</p>
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
            <label className="mb-2 block text-sm font-semibold text-cocoa">Coupon code</label>
            <input
              value={settings.couponCode}
              onChange={(event) => setSettings((current) => ({ ...current, couponCode: event.target.value.toUpperCase() }))}
              placeholder="SPRING100"
              className="w-full rounded-[1rem] border border-pink-100 bg-white/90 px-4 py-3 text-sm outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-cocoa">Discount type</label>
            <select
              value={settings.discountType}
              onChange={(event) => setSettings((current) => ({ ...current, discountType: event.target.value as "percentage" | "flat" }))}
              className="w-full rounded-[1rem] border border-pink-100 bg-white/90 px-4 py-3 text-sm outline-none"
            >
              <option value="percentage">Percentage</option>
              <option value="flat">Flat</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-cocoa">Discount value</label>
            <input
              type="number"
              min="0"
              value={settings.discountValue}
              onChange={(event) => setSettings((current) => ({ ...current, discountValue: event.target.value }))}
              placeholder="100"
              className="w-full rounded-[1rem] border border-pink-100 bg-white/90 px-4 py-3 text-sm outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-cocoa">Minimum order value</label>
            <input
              type="number"
              min="0"
              value={settings.minOrderValue}
              onChange={(event) => setSettings((current) => ({ ...current, minOrderValue: event.target.value }))}
              placeholder="999"
              className="w-full rounded-[1rem] border border-pink-100 bg-white/90 px-4 py-3 text-sm outline-none"
            />
          </div>

          <button type="button" onClick={() => void saveSettings()} disabled={saving} className="button-primary md:col-span-2">
            {saving ? "Saving campaign..." : "Save campaign settings"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
