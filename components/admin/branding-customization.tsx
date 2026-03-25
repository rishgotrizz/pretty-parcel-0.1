"use client";

import { ImagePlus, Sparkles } from "lucide-react";
import { useEffect, useState, type ChangeEvent } from "react";

import { useBranding } from "@/components/providers/brand-provider";
import { useToast } from "@/components/providers/toast-provider";

type BrandingState = {
  logoUrl: string;
  heroImageUrl: string;
  faviconUrl: string;
  whatsNewText: string;
};

const emptyBranding: BrandingState = {
  logoUrl: "",
  heroImageUrl: "",
  faviconUrl: "",
  whatsNewText: ""
};

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

function UploadField({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    onChange(await fileToDataUrl(file));
    event.target.value = "";
  }

  return (
    <div className="rounded-[1.5rem] bg-white/85 p-4">
      <p className="text-sm font-semibold text-cocoa">{label}</p>
      <label className="button-secondary mt-4 inline-flex cursor-pointer !py-2">
        <ImagePlus className="h-4 w-4" />
        Upload image
        <input type="file" accept="image/*" className="hidden" onChange={(event) => void handleFileChange(event)} />
      </label>
      {value ? (
        <img src={value} alt={label} className="mt-4 h-28 w-full rounded-[1.25rem] object-cover" />
      ) : (
        <div className="mt-4 rounded-[1.25rem] border border-dashed border-pink-200 bg-rosewater/70 px-4 py-8 text-center text-sm text-rosewood/70">
          Upload to preview this brand image.
        </div>
      )}
    </div>
  );
}

export function BrandingCustomization() {
  const [branding, setBranding] = useState<BrandingState>(emptyBranding);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { pushToast } = useToast();
  const { refreshBranding } = useBranding();

  useEffect(() => {
    async function loadBranding() {
      try {
        const response = await fetch("/api/admin/branding", {
          credentials: "include",
          headers: { Accept: "application/json" }
        });
        const raw = await response.text();
        const data = raw ? JSON.parse(raw) : {};
        setBranding({
          logoUrl: data.branding?.logoUrl ?? "",
          heroImageUrl: data.branding?.heroImageUrl ?? "",
          faviconUrl: data.branding?.faviconUrl ?? "",
          whatsNewText: data.branding?.whatsNewText ?? ""
        });
      } catch (error) {
        console.error("[BrandingCustomization] load failed", error);
        pushToast("Could not load brand customization.", "error");
      } finally {
        setLoading(false);
      }
    }

    void loadBranding();
  }, [pushToast]);

  async function saveBranding() {
    try {
      setSaving(true);
      const response = await fetch("/api/admin/branding", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(branding)
      });
      const raw = await response.text();
      const data = raw ? JSON.parse(raw) : {};

      if (!response.ok) {
        pushToast(data.error ?? "Could not save brand customization.", "error");
        return;
      }

      setBranding({
        logoUrl: data.branding?.logoUrl ?? "",
        heroImageUrl: data.branding?.heroImageUrl ?? "",
        faviconUrl: data.branding?.faviconUrl ?? "",
        whatsNewText: data.branding?.whatsNewText ?? ""
      });
      await refreshBranding();
      pushToast("Brand customization saved.", "success");
    } catch (error) {
      console.error("[BrandingCustomization] save failed", error);
      pushToast("Could not save brand customization.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="glass-panel rounded-[2rem] border border-white/70 p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-berry">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rosewood/70">Brand customization</p>
          <h2 className="mt-2 font-serif text-3xl text-cocoa">Logo, hero, favicon, and updates</h2>
        </div>
      </div>

      {loading ? <p className="mt-6 text-sm text-rosewood/70">Loading brand settings...</p> : null}

      {!loading ? (
        <>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <UploadField label="Upload Logo" value={branding.logoUrl} onChange={(value) => setBranding((current) => ({ ...current, logoUrl: value }))} />
            <UploadField label="Upload Hero Image" value={branding.heroImageUrl} onChange={(value) => setBranding((current) => ({ ...current, heroImageUrl: value }))} />
            <UploadField label="Upload Browser Tab Icon" value={branding.faviconUrl} onChange={(value) => setBranding((current) => ({ ...current, faviconUrl: value }))} />
          </div>

          <div className="mt-6">
            <label className="mb-2 block text-sm font-semibold text-cocoa">What&apos;s New Text</label>
            <textarea
              value={branding.whatsNewText}
              onChange={(event) => setBranding((current) => ({ ...current, whatsNewText: event.target.value }))}
              placeholder="Fresh bouquet drops and portrait slots are now open for April gifting."
              className="min-h-24 w-full rounded-[1rem] border border-pink-100 bg-white/90 px-4 py-3 text-sm outline-none"
            />
          </div>

          <button type="button" onClick={() => void saveBranding()} disabled={saving} className="button-primary mt-6">
            {saving ? "Saving branding..." : "Save branding"}
          </button>
        </>
      ) : null}
    </section>
  );
}
