import type { Metadata } from "next";

import "./globals.css";
import { ChatbotWidget } from "@/components/chatbot/chatbot-widget";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { AppProviders } from "@/components/providers/app-providers";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: "The Pretty Parcel | Handmade Gifts & Custom Keepsakes",
  description:
    "The Pretty Parcel is a handmade gifting website for bouquets, custom portraits, keychains, scrapbooks, and premium keepsakes with a soft feminine aesthetic.",
  openGraph: {
    title: "The Pretty Parcel",
    description: "Handmade gifts, custom keepsakes, and premium gifting experiences.",
    siteName: "The Pretty Parcel"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans text-foreground antialiased">
        <AppProviders>
          <div className="relative min-h-screen">
            <SiteHeader />
            <main className="relative z-10 overflow-x-clip pb-24 pt-3 md:pb-10 sm:pt-4">{children}</main>
          </div>
          <SiteFooter />
          <ChatbotWidget />
        </AppProviders>
      </body>
    </html>
  );
}
