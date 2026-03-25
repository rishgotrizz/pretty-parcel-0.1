"use client";

import { Truck } from "lucide-react";
import { useEffect, useState } from "react";

import { useToast } from "@/components/providers/toast-provider";

export function ShippingSettings() {
  const [shippingPrice, setShippingPrice] = useState("149");
  const [freeShippingThreshold, setFreeShippingThreshold] = useState("1999");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { pushToast } = useToast();

  useEffect(() => {
    async function loadShippingSettings() {
      try {
        const response = await fetch("/api/admin/settings/shipping", {
          credentials: "include",
          headers: { Accept: "application/json" }
        });
        const raw = await response.text();
        const data = raw ? JSON.parse(raw) : {};
        setShippingPrice(String(data.shippingPrice ?? 149));
        setFreeShippingThreshold(String(data.freeShippingThreshold ?? 1999));
      } catch (error) {
        console.error("[ShippingSettings] load failed", error);
        pushToast("Could not load shipping settings.", "error");
      } finally {
        setLoading(false);
      }
    }

    void loadShippingSettings();
  }, [pushToast]);

  async function saveShippingSettings() {
    try {
      setSaving(true);
      const response = await fetch("/api/admin/settings/shipping", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          shippingPrice: Number(shippingPrice),
          freeShippingThreshold: Number(freeShippingThreshold)
        })
      });
      const raw = await response.text();
      const data = raw ? JSON.parse(raw) : {};

      if (!response.ok) {
        pushToast(data.error ?? "Could not save shipping settings.", "error");
        return;
      }

      setShippingPrice(String(data.shippingPrice));
      setFreeShippingThreshold(String(data.freeShippingThreshold));
      pushToast("Shipping settings saved.", "success");
    } catch (error) {
      console.error("[ShippingSettings] save failed", error);
      pushToast("Could not save shipping settings.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="glass-panel rounded-[2rem] border border-white/70 p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-berry">
          <Truck className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rosewood/70">Shipping offers</p>
          <h2 className="mt-2 font-serif text-3xl text-cocoa">Delivery pricing controls</h2>
        </div>
      </div>

      {loading ? <p className="mt-6 text-sm text-rosewood/70">Loading shipping settings...</p> : null}

      {!loading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-cocoa">Shipping Price</label>
            <div className="flex items-center rounded-[1rem] border border-pink-100 bg-white/90 px-4 py-3">
              <span className="text-sm font-semibold text-rosewood">₹</span>
              <input
                type="number"
                min="0"
                value={shippingPrice}
                onChange={(event) => setShippingPrice(event.target.value)}
                className="ml-2 w-full bg-transparent text-sm outline-none"
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-cocoa">Free Shipping Threshold</label>
            <div className="flex items-center rounded-[1rem] border border-pink-100 bg-white/90 px-4 py-3">
              <span className="text-sm font-semibold text-rosewood">₹</span>
              <input
                type="number"
                min="0"
                value={freeShippingThreshold}
                onChange={(event) => setFreeShippingThreshold(event.target.value)}
                className="ml-2 w-full bg-transparent text-sm outline-none"
              />
            </div>
          </div>
          <button type="button" onClick={() => void saveShippingSettings()} disabled={saving} className="button-primary sm:col-span-2">
            {saving ? "Saving shipping..." : "Save shipping settings"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
