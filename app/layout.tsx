import type { Metadata } from "next";
import {
  Fraunces,
  Geist,
  Geist_Mono,
  Instrument_Serif,
  Inter,
} from "next/font/google";
import "./globals.css";
import { BRAND, SITE_ORIGIN } from "@/lib/brand";
import { ThemeProvider } from "@/components/theme-provider";
import { themeToCss } from "@/lib/theme/css";
import { getPublishedTheme } from "@/lib/theme/data";
import { deriveTheme } from "@/lib/theme/derive";

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

/*
 * The rest of the theme's font safe list (see `lib/theme/fonts.ts`).
 *
 * They are declared here, unconditionally, because `next/font` resolves
 * families at build time from static literals — a name coming out of the
 * database could never be fetched, so every selectable face has to exist in the
 * bundle whether or not the published theme uses it.
 *
 * `preload: false` is what keeps that from costing anything. Preloading is
 * per-face, and preloading four families on every page to use two would push
 * real bytes at every visitor for a choice only the admin sees. Without it the
 * @font-face rules ship (a few hundred bytes of CSS) but no font file is
 * fetched until a rule actually matches rendered text.
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  preload: false,
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  /*
   * Read server-side and inlined below, never fetched after mount.
   *
   * Anything else flashes: the browser would paint the stylesheet's built-in
   * palette first and repaint once the real theme arrived. Inlining costs a few
   * hundred bytes in the document and makes the themed first paint the only
   * paint. The loader uses the cookie-free client precisely so doing this in
   * the root layout does not make every route dynamic.
   */
  const theme = await getPublishedTheme();
  const themeCss = themeToCss(deriveTheme(theme));

  return (
    /*
     * suppressHydrationWarning: next-themes writes the class on <html> before
     * paint to avoid a flash, which by definition differs from the server HTML.
     *
     * data-scroll-behavior: globals.css sets `scroll-behavior: smooth` on
     * <html>; Next needs this attribute to keep disabling it during route
     * transitions in a future version.
     *
     * className: the next/font variables belong on <html>, not <body>. They sat
     * on <body> for as long as nothing above it referenced them. The theme block
     * changes that — it sets `--theme-font-body: var(--font-geist-sans), …` on
     * `:root`, and a custom property whose value references a variable that is
     * undefined *at that element* is invalid at computed-value time, resolving
     * to nothing rather than to the text. With the fonts declared a level below,
     * every face an admin picked collapsed into the fallback: the control looked
     * like it worked and changed nothing. Declaring them here puts them in scope.
     */
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} ${inter.variable} ${instrumentSerif.variable}`}
      suppressHydrationWarning
    >
      {/*
       * Explicit <head> so the theme block is in the document head of the very
       * first flush, before any markup that could paint with the stylesheet's
       * built-in palette.
       *
       * A bare <style> here does *not* get there. React 19 only hoists style
       * elements that carry both `href` and `precedence`; without them it
       * renders in place, which put this after </head> as the first node of
       * <body>. That still applies — a style element in the body is honoured —
       * but it is not what "inject into the head" means, and it leaves the
       * ordering to chance. Rendering the <head> outright removes the question.
       *
       * Next merges its own metadata-driven tags into this head; only elements
       * the Metadata API owns (title, meta) must stay out of it.
       *
       * The content is generated entirely from numbers and a fixed font table
       * (see lib/theme/css.ts), so there is no admin-supplied text in it.
       */}
      <head>
        <style id="site-theme" dangerouslySetInnerHTML={{ __html: themeCss }} />
      </head>
      <body className="antialiased">
        <ThemeProvider defaultMode={theme.defaultMode}>{children}</ThemeProvider>
      </body>
    </html>
  );
}
