/**
 * Decorative page backdrops — five designs, generated from the palette.
 *
 * These are *recipes*, not artwork. Each one is a function of the derived
 * palette, so it is painted in the theme's own hues and cannot clash with a
 * colour the admin picked; swapping the brand from gold to teal re-tints every
 * backdrop with it. Fixed artwork would have to be redrawn per theme, or would
 * fight four of the five palettes.
 *
 * All CSS gradients (plus one inline SVG for grain) — no image requests, a few
 * hundred bytes, and nothing animated. The site already carries a lot of
 * motion; a moving background would compete with it and cost a repaint budget
 * that the 3D room needs more.
 *
 * **Contrast is part of the contract.** These layers sit *behind* body text, so
 * a heavy one could push text below AA even though every token still passes in
 * isolation. Each recipe therefore declares `peakAlpha` and the token it tints
 * with, and `backdropWorstCase` composites that to give the darkest (or
 * lightest) ground the design can produce. `backdrops.test.ts` asserts text
 * still clears AA over it, for every preset, every backdrop, both modes — so a
 * backdrop cannot be the thing that makes a published site unreadable.
 */

import {
  type Oklch,
  compositeOver,
  formatOklchAlpha,
  isLight,
} from "@/lib/theme/oklch";
import type { DerivedPalette } from "@/lib/theme/tokens";

/**
 * The only tokens a backdrop reads. Stated narrowly on purpose: `derive.ts`
 * feeds the worst case back into its text solve, and this is what proves the
 * recipe needs nothing that the solve has not computed yet.
 */
export type BackdropSource = Pick<
  DerivedPalette,
  "background" | "brand" | "primary" | "foreground"
>;

export const BACKDROP_IDS = [
  "none",
  "aurora",
  "mesh",
  "spotlight",
  "grain",
  "linen",
] as const;

export type BackdropId = (typeof BACKDROP_IDS)[number];

export type BackdropMeta = {
  id: BackdropId;
  name: string;
  description: string;
};

export const BACKDROPS: BackdropMeta[] = [
  {
    id: "none",
    name: "None",
    description: "Flat colour. Lets photography carry the page.",
  },
  {
    id: "aurora",
    name: "Aurora",
    description: "Warm pools of light drifting down the page, like lamps.",
  },
  {
    id: "mesh",
    name: "Mesh",
    description: "Four soft corner washes that blend across the middle.",
  },
  {
    id: "spotlight",
    name: "Spotlight",
    description: "One broad glow from above, brightest behind the headline.",
  },
  {
    id: "grain",
    name: "Grain",
    description: "Fine film grain. Reads as paper stock rather than screen.",
  },
  {
    id: "linen",
    name: "Linen",
    description: "A whisper of diagonal weave. Texture you feel, not see.",
  },
];

/**
 * Peak alpha and tint per design, in one table so the contrast proof and the
 * CSS below can never disagree about how strong a backdrop gets.
 *
 * Dark grounds get a higher ceiling: the same alpha over near-black is far less
 * visible than over ivory, so matching the light values would make every dark
 * backdrop invisible.
 */
const PEAK: Record<
  BackdropId,
  { token: keyof BackdropSource; light: number; dark: number }
> = {
  none: { token: "background", light: 0, dark: 0 },
  aurora: { token: "brand", light: 0.13, dark: 0.16 },
  mesh: { token: "brand", light: 0.14, dark: 0.17 },
  spotlight: { token: "brand", light: 0.15, dark: 0.18 },
  /*
   * Grain and linen tint toward the *text* colour rather than the brand, so
   * they shift the ground the whole way across the page instead of pooling —
   * which is why their ceilings are a fraction of the others'.
   *
   * For grain this number is also the SVG rect's opacity, not an estimate of
   * it. Noise is high-frequency: individual pixels reach full black or white,
   * so the worst case a letter can land on is a pixel at exactly this alpha.
   * Wiring the same value into both places is what stops the contrast proof
   * describing a layer the page does not actually paint.
   */
  grain: { token: "foreground", light: 0.06, dark: 0.09 },
  linen: { token: "foreground", light: 0.025, dark: 0.04 },
};

/**
 * Strongest alpha this design reaches on this ground.
 *
 * The single number both the rendering and the contrast proof are built from,
 * exported so a test can assert they still agree — see the note on `grain`.
 */
export function backdropPeakAlpha(
  palette: BackdropSource,
  id: BackdropId
): number {
  const peak = PEAK[id];
  return isLight(palette.background) ? peak.light : peak.dark;
}

/**
 * The most extreme ground this backdrop can produce over the page colour.
 *
 * What the contrast test measures. A gradient's alpha varies across the page,
 * so this takes the peak — where the layer is strongest and text has the least
 * to work with.
 */
export function backdropWorstCase(
  palette: BackdropSource,
  id: BackdropId
): Oklch {
  const alpha = backdropPeakAlpha(palette, id);
  if (alpha === 0) return palette.background;
  return compositeOver(palette[PEAK[id].token], palette.background, alpha);
}

/**
 * Fine grain, as an inline SVG.
 *
 * `feTurbulence` gives real per-pixel noise for ~250 bytes, where a PNG of the
 * same tile would be a network request and several KB. The explicit
 * width/height give the SVG an intrinsic size, so it tiles at 160px instead of
 * stretching to the page.
 *
 * The only interpolated value is `opacity`, and it is a rounded number — the
 * markup around it is a constant, so this keeps the same guarantee as the
 * gradients: nothing an admin types can reach the stylesheet.
 *
 * It takes its opacity from PEAK rather than carrying its own. The two were
 * separate at first, with the rect fixed at 0.55 while PEAK claimed 0.05, so
 * grain rendered roughly ten times heavier than the value its own contrast
 * proof was checking — visible immediately as a dark-mode tile several shades
 * lighter than every other design.
 */
function grainTile(opacity: number): string {
  const alpha = Math.round(Math.min(1, Math.max(0, opacity)) * 1000) / 1000;
  return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='${alpha}'/%3E%3C/svg%3E")`;
}

/**
 * The `background-image` value for a backdrop, or `none`.
 *
 * Every colour goes through `formatOklchAlpha`, so the output is gradient
 * keywords, numbers and percentages — the same injection-proof property the
 * rest of the theme CSS has.
 */
export function backdropCss(palette: BackdropSource, id: BackdropId): string {
  const dark = !isLight(palette.background);
  const peak = PEAK[id];
  const scale = dark ? peak.dark : peak.light;
  // Each layer's share of the design's peak, so the whole thing scales with one
  // number and the contrast proof stays honest.
  const tint = (token: keyof BackdropSource, share: number) =>
    formatOklchAlpha(palette[token], scale * share);

  switch (id) {
    case "none":
      return "none";

    /*
     * Anchored to the document, not the viewport: the pools sit at percentages
     * of the page's height, so you scroll *through* warm zones the way you
     * would past real lamps. The first starts at 20% so its falloff clears the
     * homepage hero, which paints an opaque background over anything above it.
     */
    case "aurora":
      return [
        `radial-gradient(80% 12% at 20% 20%, ${tint("brand", 1)}, transparent 68%)`,
        `radial-gradient(70% 11% at 95% 37%, ${tint("brand", 0.75)}, transparent 66%)`,
        `radial-gradient(85% 13% at 0% 55%, ${tint("brand", 0.65)}, transparent 66%)`,
        `radial-gradient(70% 11% at 88% 73%, ${tint("primary", 0.6)}, transparent 66%)`,
        `radial-gradient(90% 12% at 35% 90%, ${tint("brand", 0.7)}, transparent 66%)`,
      ].join(",");

    case "mesh":
      return [
        `radial-gradient(60% 55% at 0% 0%, ${tint("brand", 1)}, transparent 70%)`,
        `radial-gradient(55% 50% at 100% 5%, ${tint("primary", 0.7)}, transparent 70%)`,
        `radial-gradient(65% 60% at 100% 100%, ${tint("brand", 0.6)}, transparent 70%)`,
        `radial-gradient(50% 55% at 0% 95%, ${tint("primary", 0.5)}, transparent 70%)`,
      ].join(",");

    case "spotlight":
      return [
        `radial-gradient(120% 55% at 50% -8%, ${tint("brand", 1)}, transparent 62%)`,
        `radial-gradient(90% 40% at 50% 105%, ${tint("primary", 0.45)}, transparent 65%)`,
      ].join(",");

    case "grain":
      return grainTile(scale);

    /*
     * 3px period rather than the 4px that reads best on a desktop panel: at 4px
     * the stripe lands near the pixel grid on a 2x display and shimmers when
     * the page scrolls.
     */
    case "linen":
      return `repeating-linear-gradient(45deg, ${tint("foreground", 1)} 0 1px, transparent 1px 3px)`;
  }
}

/**
 * Grain is a tile and must repeat; the gradients resolve to the full box, where
 * `repeat` is a no-op. One value covers both rather than a second variable.
 */
export const BACKDROP_REPEAT = "repeat";
