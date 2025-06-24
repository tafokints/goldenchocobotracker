import type { Metadata } from "next";
import { Cinzel } from "next/font/google";
import "./globals.css";
import React from "react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const cinzel = Cinzel({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Golden Chocobo Tracker",
  description: "Tracking the 77 serialized Golden Chocobo cards from MTG.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cinzel.className}>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
} 