"use client";

import { AuthProvider } from "@/components/providers/auth-provider";
import { AnalyticsTracker } from "@/components/providers/analytics-tracker";
import { BrandProvider } from "@/components/providers/brand-provider";
import { NotificationCenter } from "@/components/providers/notification-center";
import { ToastProvider } from "@/components/providers/toast-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <BrandProvider>
        <ToastProvider>
          <AnalyticsTracker />
          <NotificationCenter />
          {children}
        </ToastProvider>
      </BrandProvider>
    </AuthProvider>
  );
}
