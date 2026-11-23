import type { Metadata, Viewport } from 'next';
import { Cinzel } from 'next/font/google';
import './globals.css';
import React from 'react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';
import AffiliateDisclosure from '../components/AffiliateDisclosure';
import { getSiteUrl } from '@/lib/site-config';

const cinzel = Cinzel({ subsets: ['latin'], display: 'swap' });
const siteUrl = getSiteUrl();

export const viewport: Viewport = {
  themeColor: '#D6A73D',
};

export const metadata: Metadata = {
  title: {
    default: 'Golden Chocobo Tracker - MTG Final Fantasy Serialized Cards',
    template: '%s | Golden Chocobo Tracker',
  },
  description:
    "Track all 77 serialized Golden Chocobo cards from Magic: The Gathering's Final Fantasy collaboration. Real-time updates, reported sales, grading data, and statistics for collectors.",
  keywords: [
    'Golden Chocobo',
    'MTG Final Fantasy',
    'Magic The Gathering',
    'serialized cards',
    'collector tracker',
    'Final Fantasy cards',
    'MTG collector',
    'rare cards',
    'card tracking',
    'Golden Chocobo tracker',
  ],
  authors: [{ name: 'Golden Chocobo Tracker' }],
  creator: 'Golden Chocobo Tracker',
  publisher: 'Golden Chocobo Tracker',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    title: 'Golden Chocobo Tracker - MTG Final Fantasy Serialized Cards',
    description:
      "Track all 77 serialized Golden Chocobo cards from Magic: The Gathering's Final Fantasy collaboration. Real-time updates, prices, and statistics for collectors.",
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
    description:
      "Track all 77 serialized Golden Chocobo cards from Magic: The Gathering's Final Fantasy collaboration.",
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
    google: 'Wk33xovnISzNrBj7DbC1fT1OIzs53G7IZHXtI85KDdw',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Chocobo Tracker',
  },
  other: {
    'msapplication-TileColor': '#D6A73D',
    'msapplication-config': '/browserconfig.xml',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cinzel.className}>
        <AffiliateDisclosure />
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
