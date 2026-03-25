"use client";

import { AuthProvider } from "@/components/providers/auth-provider";
import { AnalyticsTracker } from "@/components/providers/analytics-tracker";
import { NotificationCenter } from "@/components/providers/notification-center";
import { ToastProvider } from "@/components/providers/toast-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <AnalyticsTracker />
        <NotificationCenter />
        {children}
      </ToastProvider>
    </AuthProvider>
  );
}
