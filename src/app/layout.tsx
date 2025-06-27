import type { Metadata } from "next";
import { Cinzel } from "next/font/google";
import "./globals.css";
import React from "react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

const cinzel = Cinzel({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Golden Chocobo Tracker - MTG Final Fantasy Serialized Cards",
    template: "%s | Golden Chocobo Tracker"
  },
  description: "Track all 77 serialized Golden Chocobo cards from Magic: The Gathering's Final Fantasy collaboration. Real-time updates, prices, and statistics for collectors.",
  keywords: [
    "Golden Chocobo",
    "MTG Final Fantasy",
    "Magic The Gathering",
    "serialized cards",
    "collector tracker",
    "Final Fantasy cards",
    "MTG collector",
    "rare cards",
    "card tracking",
    "Golden Chocobo tracker"
  ],
  authors: [{ name: "Golden Chocobo Tracker" }],
  creator: "Golden Chocobo Tracker",
  publisher: "Golden Chocobo Tracker",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://goldenchocobotracker.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://goldenchocobotracker.com',
    title: 'Golden Chocobo Tracker - MTG Final Fantasy Serialized Cards',
    description: 'Track all 77 serialized Golden Chocobo cards from Magic: The Gathering\'s Final Fantasy collaboration. Real-time updates, prices, and statistics for collectors.',
    siteName: 'Golden Chocobo Tracker',
    images: [
      {
        url: '/images/chocobo-01.jpg',
        width: 1200,
        height: 630,
        alt: 'Golden Chocobo Tracker - MTG Final Fantasy Cards',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Golden Chocobo Tracker - MTG Final Fantasy Serialized Cards',
    description: 'Track all 77 serialized Golden Chocobo cards from Magic: The Gathering\'s Final Fantasy collaboration.',
    images: ['/images/chocobo-01.jpg'],
    creator: '@goldenchocobotracker',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#D6A73D" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Chocobo Tracker" />
        <link rel="apple-touch-icon" href="/images/chocobo-01.jpg" />
        <meta name="msapplication-TileColor" content="#D6A73D" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body className={cinzel.className}>
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
} 