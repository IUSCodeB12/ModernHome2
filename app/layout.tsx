import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BRAND, SITE_ORIGIN } from "@/lib/brand";
import { ThemeProvider } from "@/components/theme-provider";

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
    // suppressHydrationWarning: next-themes writes the class on <html> before
    // paint to avoid a flash, which by definition differs from the server HTML.
    // data-scroll-behavior: globals.css sets `scroll-behavior: smooth` on
    // <html>; Next needs this attribute to keep disabling it during route
    // transitions in a future version.
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} antialiased`}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
