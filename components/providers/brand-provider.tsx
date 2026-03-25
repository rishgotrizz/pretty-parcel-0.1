"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type BrandAssets = {
  logoUrl: string;
  heroImageUrl: string;
};

type BrandContextValue = {
  branding: BrandAssets;
  refreshBranding: () => Promise<void>;
};

const BrandContext = createContext<BrandContextValue | null>(null);

const defaultBranding: BrandAssets = {
  logoUrl: "",
  heroImageUrl: ""
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
        heroImageUrl: data.branding?.heroImageUrl ?? ""
      });
    } catch (error) {
      console.error("[BrandProvider] refresh failed", error);
      setBranding(defaultBranding);
    }
  };

  useEffect(() => {
    void refreshBranding();
  }, []);

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
