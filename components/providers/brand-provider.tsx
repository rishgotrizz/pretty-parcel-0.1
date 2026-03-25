"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type BrandAssets = {
  logoUrl: string;
  heroImageUrl: string;
  faviconUrl: string;
  whatsNewText: string;
};

type BrandContextValue = {
  branding: BrandAssets;
  refreshBranding: () => Promise<void>;
};

const BrandContext = createContext<BrandContextValue | null>(null);

const defaultBranding: BrandAssets = {
  logoUrl: "",
  heroImageUrl: "",
  faviconUrl: "",
  whatsNewText: ""
};

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<BrandAssets>(defaultBranding);

  const refreshBranding = async () => {
    try {
      const response = await fetch("/api/branding", {
        cache: "no-store",
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
      console.error("[BrandProvider] refresh failed", error);
      setBranding(defaultBranding);
    }
  };

  useEffect(() => {
    void refreshBranding();
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const iconHref = branding.faviconUrl || "/favicon.ico";
    let iconLink = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
    if (!iconLink) {
      iconLink = document.createElement("link");
      iconLink.rel = "icon";
      document.head.appendChild(iconLink);
    }
    iconLink.href = iconHref;
  }, [branding.faviconUrl]);

  const value = useMemo(
    () => ({
      branding,
      refreshBranding
    }),
    [branding]
  );

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export function useBranding() {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error("useBranding must be used within BrandProvider");
  }
  return context;
}
