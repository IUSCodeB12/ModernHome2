import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BRAND, SITE_ORIGIN } from "@/lib/brand";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Editorial display face for headlines (variable weight + optical size).
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz"],
});

const siteUrl = SITE_ORIGIN;

/** Headline used for the tab title and both social cards. */
const headline = `${BRAND.name} — ${BRAND.tagline}`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: headline,
    template: `%s · ${BRAND.name}`,
  },
  description:
    "Trusted local tradies for TV mounting, cabinets, LED lighting and heating. Get an instant, fixed-price quote online and book a time that suits — no callout fees.",
  applicationName: BRAND.name,
  keywords: [
    "TV wall mounting",
    "floating cabinet",
    "LED strip lighting",
    "home improvement",
    "instant quote",
    "Melbourne tradie",
  ],
  openGraph: {
    type: "website",
    siteName: BRAND.name,
    title: headline,
    description:
      "Instant, fixed-price quotes for home installations. Book a trusted local tradie online.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: headline,
    description:
      "Instant, fixed-price quotes for home installations. Book a trusted local tradie online.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
