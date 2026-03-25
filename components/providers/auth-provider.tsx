"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type AuthUser = {
  _id: string;
  name: string;
  email: string;
  role: "user" | "customer" | "admin";
  level?: number;
  wishlist?: string[];
  notificationPermission?: "default" | "granted" | "denied";
  notificationEnabled?: boolean;
  notificationRewardClaimed?: boolean;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/auth/me", {
        cache: "no-store",
        credentials: "include",
        headers: { Accept: "application/json" }
      });
      const raw = await response.text();
      const data = raw ? JSON.parse(raw) : {};
      setUser((data?.data?.user ?? data?.user ?? null) as AuthUser | null);
    } catch (error) {
      console.error("[AuthProvider] refresh failed", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      refresh,
      setUser
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
