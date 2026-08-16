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
     * Every percentage below resolves against one TILE (see BACKDROP_SIZE), not
     * against the page. That is the whole reason these read the same on a short
     * legal page and on the 11,000px homepage.
     *
     * They were originally percentages of the backdrop element, which spans the
     * document — so the composition stretched with the page. Spotlight's glow
     * had a 1,043px radius on /services and a 6,417px radius on the homepage:
     * the same alpha smeared over six times the distance, which is no glow at
     * all. Tiling fixes the density; it also means every design keeps working
     * however long a page grows.
     *
     * The cost of tiling is a seam if a layer is still opaque at a tile edge.
     * Each one is therefore placed so its falloff completes inside the tile —
     * `noVisibleSeamWhenTiled` in `backdrops.test.ts` checks the arithmetic.
     */
    case "aurora":
      return [
        `radial-gradient(70% 14% at 22% 16%, ${tint("brand", 1)}, transparent 70%)`,
        `radial-gradient(60% 12% at 88% 34%, ${tint("brand", 0.75)}, transparent 68%)`,
        `radial-gradient(75% 14% at 10% 54%, ${tint("brand", 0.65)}, transparent 68%)`,
        `radial-gradient(60% 12% at 82% 72%, ${tint("primary", 0.6)}, transparent 66%)`,
        `radial-gradient(80% 13% at 38% 88%, ${tint("brand", 0.7)}, transparent 66%)`,
      ].join(",");

    /*
     * Pulled in off the corners. At 0%/100% the washes were at full strength
     * exactly where tiles meet, which stacks two of them into a bright band
     * once per tile — the one arrangement tiling cannot survive.
     */
    case "mesh":
      return [
        `radial-gradient(55% 22% at 12% 20%, ${tint("brand", 1)}, transparent 70%)`,
        `radial-gradient(50% 20% at 90% 38%, ${tint("primary", 0.7)}, transparent 70%)`,
        `radial-gradient(58% 22% at 92% 68%, ${tint("brand", 0.6)}, transparent 70%)`,
        `radial-gradient(52% 20% at 8% 84%, ${tint("primary", 0.5)}, transparent 70%)`,
      ].join(",");

    /*
     * Sits at 30% of the tile rather than above its top edge. Anchored at
     * `-8%` the glow was centred off-screen, so on the homepage the part that
     * remained was hidden under the hero's opaque 900px band and the rest was
     * pure falloff.
     */
    case "spotlight":
      return [
        `radial-gradient(110% 26% at 50% 30%, ${tint("brand", 1)}, transparent 66%)`,
        `radial-gradient(80% 18% at 50% 78%, ${tint("primary", 0.45)}, transparent 64%)`,
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
 * `background-size` for a backdrop — what makes the design viewport-scaled.
 *
 * The gradients get a tile one and a bit screens tall, so their composition has
 * a fixed physical size and repeats down however long the page happens to be.
 * 140vh rather than exactly 100vh so the pattern does not lock to a screenful
 * and read as paging.
 *
 * Grain and linen are already periodic — an SVG tile and a repeating gradient —
 * so they keep their intrinsic size and would only be distorted by a stretch.
 */
export function backdropSize(id: BackdropId): string {
  switch (id) {
    case "aurora":
    case "mesh":
    case "spotlight":
      return "100% 140vh";
    default:
      return "auto";
  }
}

/** Everything tiles now, and `repeat` is the default for the intrinsic ones. */
export const BACKDROP_REPEAT = "repeat";
