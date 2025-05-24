// Metadata configuration
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import MosaicProvider from '@/components/MosaicProvider';
import { Providers } from "@/lib/providers";
import type { Metadata, Viewport } from "next";
import { Comfortaa, Inter } from "next/font/google";
import "./globals.css";

// Optimize font loading with display: swap to prevent blocking render
const comfortaa = Comfortaa({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-comfortaa",
  display: "swap", // Prevent render blocking
});

const comfortaaBold = Comfortaa({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-comfortaa-bold",
  display: "swap", // Prevent render blocking
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-inter",
  display: "swap", // Prevent render blocking
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // Fix accessibility issue by allowing user scaling
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.mosaicchats.com"),
  title: {
    default: "AI Chat Analysis & Relationship Insights | Mosaic",
    template: "%s | Mosaic Chat Analysis",
  },
  description:
    "Transform your chat conversations into meaningful insights with AI-powered analysis. Understand communication patterns, personality traits, and relationship dynamics through advanced chat analysis.",
  keywords: [
    "chat analysis",
    "relationship analysis",
    "AI chat analyzer",
    "conversation analysis",
    "relationship insights",
    "chat sentiment analysis",
    "personality insights",
    "communication patterns",
    "WhatsApp analysis",
    "iMessage analysis",
    "Telegram analysis",
    "relationship compatibility",
    "chat analytics",
    "relationship dynamics",
    "message analysis",
    "text analysis",
    "chat insights",
    "relationship assessment",
    "conversation insights",
    "chat patterns",
  ],
  authors: [{ name: "MosaicAI Team" }],
  creator: "MosaicAI",
  publisher: "MosaicAI",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.mosaicchats.com",
    siteName: "Mosaic AI",
    title: "AI-Powered Chat Analysis for Relationship Insights",
    description:
      "Transform your chat conversations into meaningful insights. Analyze communication patterns, understand relationship dynamics, and get personalized recommendations with AI-powered chat analysis.",
    images: [
      {
        url: "/favicon.png",
        width: 48,
        height: 48,
        alt: "Mosaic Logo",
      },
    ],
  },
  other: {
    instagram: "mosaicchats",
  },
  verification: {
    google: "w2FYvshC7IVKyKSuBv_soyXI4U6cT5_I89bjH9QDeKI",
  },
  alternates: {
    canonical: "https://www.mosaicchats.com",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${comfortaa.variable} ${comfortaaBold.variable}`}
    >
      <body className="bg-black text-gray-200">
        {/* Only load Google Analytics in production */}
        {process.env.NODE_ENV === "production" && GA_MEASUREMENT_ID && (
          <GoogleAnalytics measurementId={GA_MEASUREMENT_ID} />
        )}
        <MosaicProvider>
          <Providers>{children}</Providers>
        </MosaicProvider>
      </body>
    </html>
  );
}
