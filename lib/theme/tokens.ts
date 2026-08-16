/**
 * The theme's shape: what an admin edits, and what the site consumes.
 *
 * Two types matter here and the distinction is the whole design.
 *
 * `ThemeInput` is the *authored* theme — four colours, a radius, two fonts, a
 * default mode. It is what lives in the database and what the admin UI binds
 * to. It is deliberately tiny.
 *
 * `DerivedTheme` is the *computed* theme — the full twenty-odd CSS custom
 * properties the site actually paints with, produced from `ThemeInput` by
 * `derive.ts`. It is never stored.
 *
 * Keeping those apart is what stops an admin producing an ugly result. Shade
 * ramps, hover states, muted text, borders and every foreground pairing are
 * computed under rules that enforce contrast, so they cannot drift out of
 * relation with each other. The admin picks intent; the system picks values.
 *
 * The font safe list lives in `fonts.ts` — it is a build-time concern (see
 * the note there on why a font family can never come from the database).
 *
 * @see derive.ts   the rules that turn one into the other
 * @see presets.ts  five authored `ThemeInput`s
 */

import type { BackdropId } from "@/lib/theme/backdrops";
import type { FontId } from "@/lib/theme/fonts";
import type { Oklch } from "@/lib/theme/oklch";

/**
 * Bump when a stored blob can no longer be read by `derive.ts` as-is.
 *
 * Every row carries the version it was written under, so a future migration
 * can upgrade old blobs instead of guessing. Additive changes with a sensible
 * default do not need a bump; renaming or removing a field does.
 */
export const THEME_SCHEMA_VERSION = 1;

// ---------------------------------------------------------------------------
// Authored theme
// ---------------------------------------------------------------------------

/** The four colours an admin actually chooses. Everything else derives. */
export type ThemePalette = {
  /** Page ground. Drives card, popover, muted, secondary, accent and borders. */
  background: Oklch;
  /** Body text. Drives every foreground pairing and muted text. */
  foreground: Oklch;
  /** Solid button fill and other high-emphasis surfaces. */
  primary: Oklch;
  /** The accent — CTAs, selection, focus rings, the LED glow in the 3D room. */
  brand: Oklch;
};

export type ThemeMode = "light" | "dark" | "system";

export type ThemeInput = {
  schemaVersion: number;
  light: ThemePalette;
  /**
   * Explicit dark palette, or null to derive one from `light`.
   *
   * Null is the common case and the better one — a derived dark palette keeps
   * the hue relationships of the light palette, which is what stops dark mode
   * looking like a different brand. An explicit palette exists for themes that
   * are *authored* dark-first, like the Midnight preset.
   */
  dark: ThemePalette | null;
  /** Base corner radius in rem. The four Tailwind radii derive from it. */
  radius: number;
  fonts: { body: FontId; display: FontId };
  /** Decorative page backdrop, painted from this theme's own colours. */
  backdrop: BackdropId;
  /** What a first-time visitor sees before touching the light/dark switch. */
  defaultMode: ThemeMode;
  /** Public URLs in the `gallery` bucket under `brand/`. Null uses `lib/brand.ts`. */
  logo: { light: string | null; dark: string | null };
};

// ---------------------------------------------------------------------------
// Derived theme
// ---------------------------------------------------------------------------

/**
 * Every custom property the theme overrides, in the names `globals.css`
 * already uses so nothing downstream has to change.
 *
 * Notably absent: `--sidebar-*` and `--chart-*`. Those are admin chrome. The
 * theme governs the public site only, so an unreadable choice can never lock
 * an admin out of the screen where they would fix it.
 */
export const TOKEN_NAMES = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "border",
  "input",
  "ring",
  "brand",
  "brand-foreground",
] as const;

export type TokenName = (typeof TOKEN_NAMES)[number];

export type DerivedPalette = Record<TokenName, Oklch>;

export type DerivedTheme = {
  light: DerivedPalette;
  dark: DerivedPalette;
  radius: number;
  fonts: { body: string; display: string };
  /** Ready-to-use `background-image` values, one per mode. */
  backdrop: { id: BackdropId; light: string; dark: string };
  defaultMode: ThemeMode;
  logo: { light: string | null; dark: string | null };
};

// ---------------------------------------------------------------------------
// Fallback
// ---------------------------------------------------------------------------

/**
 * The locked fallback — the palette currently live on acestudio55.com.au,
 * lifted verbatim from `app/globals.css`.
 *
 * This is what "Reset to default" restores, what renders when Supabase is
 * unconfigured, and what the site falls back to if a stored blob ever fails to
 * parse. It is also the `Ivory` preset, so the two can never drift apart.
 *
 * The brand value has history worth knowing before changing it: it was retuned
 * from a saturated orange to this champagne gold to match the AS55 logo, which
 * is a fixed-hue PNG that cannot be recoloured. A brand hue far from ~82° will
 * visibly clash with the mark unless a new logo is uploaded alongside it.
 */
export const DEFAULT_THEME: ThemeInput = {
  schemaVersion: THEME_SCHEMA_VERSION,
  light: {
    background: { l: 0.988, c: 0.005, h: 84 },
    foreground: { l: 0.21, c: 0.014, h: 55 },
    primary: { l: 0.245, c: 0.016, h: 55 },
    brand: { l: 0.755, c: 0.095, h: 82 },
  },
  dark: {
    background: { l: 0.165, c: 0.008, h: 58 },
    foreground: { l: 0.955, c: 0.006, h: 84 },
    primary: { l: 0.945, c: 0.007, h: 84 },
    brand: { l: 0.8, c: 0.1, h: 84 },
  },
  radius: 0.75,
  fonts: { body: "geist", display: "fraunces" },
  // The warm pools globals.css already paints with the lights off, now a
  // choice rather than a hardcoded dark-mode-only rule.
  backdrop: "aurora",
  defaultMode: "system",
  logo: { light: null, dark: null },
};
