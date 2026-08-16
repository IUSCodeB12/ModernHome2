/**
 * The computed theme as CSS — the only thing that ever reaches a visitor.
 *
 * The public payload is this string and nothing else: a couple of hundred bytes
 * of custom properties, inlined into the document head. None of the OKLCH
 * conversion, contrast solving or preset data ships to the site — those modules
 * are imported by the admin bundle and by server code only, so a visitor
 * downloads the *result* of the colour engine and never the engine.
 *
 * Every value here is produced by `formatOklch` or by a number formatter, so
 * the output cannot contain admin-supplied text. That is what makes inlining a
 * database-driven stylesheet safe.
 */

import type { DerivedPalette, DerivedTheme } from "@/lib/theme/tokens";
import { TOKEN_NAMES } from "@/lib/theme/tokens";
import { formatOklch } from "@/lib/theme/oklch";

/**
 * Scope for the injected block.
 *
 * The theme governs the public site only, so it must not apply to `/admin` —
 * an unreadable palette should never be able to hide the screen where it gets
 * fixed. `:has()` does that without needing to know which route is rendering:
 * the public layout wraps its tree in `.site-theme` (it already did, for the
 * display-serif rules), admin and auth layouts do not, and the custom
 * properties land on `:root` either way so the `<body>` fill is covered too —
 * which a `.site-theme { … }` block alone would leave behind on overscroll.
 */
const SCOPE = ":root:has(.site-theme)";

/** next-themes writes `class="dark"` on `<html>`, so the dark scope stacks. */
const DARK_SCOPE = ":root.dark:has(.site-theme)";

function paletteBody(palette: DerivedPalette): string {
  return TOKEN_NAMES.map(
    (name) => `--${name}:${formatOklch(palette[name])}`
  ).join(";");
}

/**
 * The full `<style>` body for a derived theme.
 *
 * Minified by construction rather than by a build step — it is one long line
 * because it is inlined into every HTML response, and the newlines would be a
 * meaningful fraction of its size.
 */
export function themeToCss(theme: DerivedTheme): string {
  const radius = `--radius:${clampRem(theme.radius)}rem`;
  // Prefixed to stay clear of `--font-display`, which `@theme inline` in
  // globals.css already owns as a Tailwind theme key. That one is resolved at
  // build time and never emitted at runtime, so the names would not actually
  // fight — but two different `--font-display`s meaning two different things
  // in one stylesheet is a trap for whoever reads this next.
  const fonts = `--theme-font-body:${theme.fonts.body};--theme-font-display:${theme.fonts.display}`;

  return [
    `${SCOPE}{${paletteBody(theme.light)};${radius};${fonts};--theme-backdrop:${theme.backdrop.light}}`,
    `${DARK_SCOPE}{${paletteBody(theme.dark)};--theme-backdrop:${theme.backdrop.dark}}`,
  ].join("");
}

/** Radius is the one free-form number an admin types; keep it sane and finite. */
function clampRem(value: number): number {
  const n = Number.isFinite(value) ? value : 0.75;
  return Math.round(Math.min(2, Math.max(0, n)) * 1000) / 1000;
}

/**
 * The same tokens as a React `style` object, for the admin's preview pane.
 *
 * The preview does not need an iframe. Custom properties cascade to a subtree,
 * so setting them on one wrapper gives the sample components exactly the same
 * isolation an iframe would — with no postMessage bridge, no second document to
 * keep in sync, and no serialisation step between a keystroke and the repaint.
 */
export function themeToStyle(
  palette: DerivedPalette,
  extras?: { radius?: number; fonts?: DerivedTheme["fonts"] }
): React.CSSProperties {
  const style: Record<string, string> = {};
  for (const name of TOKEN_NAMES) {
    style[`--${name}`] = formatOklch(palette[name]);
  }
  if (extras?.radius !== undefined) {
    style["--radius"] = `${clampRem(extras.radius)}rem`;
  }
  if (extras?.fonts) {
    style["--theme-font-body"] = extras.fonts.body;
    style["--theme-font-display"] = extras.fonts.display;
  }
  return style as React.CSSProperties;
}

/**
 * Short stable digest of the emitted CSS.
 *
 * Used as the cache tag for the published theme and as the key that tells the
 * preview pane a redeploy actually changed something. FNV-1a: not a security
 * primitive and never used as one — it only needs to differ when the bytes do.
 */
export function themeHash(css: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < css.length; i++) {
    hash ^= css.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(36);
}
