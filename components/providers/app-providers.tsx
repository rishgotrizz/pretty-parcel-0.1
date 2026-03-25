"use client";

import { AuthProvider } from "@/components/providers/auth-provider";
import { AnalyticsTracker } from "@/components/providers/analytics-tracker";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AnalyticsTracker />
      {children}
    </AuthProvider>
  );
}
