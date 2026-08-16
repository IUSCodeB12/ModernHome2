/**
 * OKLCH colour maths — the whole colour engine, in one pure module.
 *
 * Why hand-rolled rather than `culori`/`colorjs.io`: this is ~150 lines of
 * documented matrix algebra, it never ships to a visitor (the admin bundle is
 * the only consumer), and the repo already keeps its load-bearing maths pure
 * and unit-tested — `lib/slots.ts`, `lib/quote/estimate.ts`, `lib/invoice/calc.ts`.
 * A dependency here would buy a colour-space zoo we don't need and would still
 * need this file's derivation rules on top.
 *
 * Everything below operates on `{ l, c, h }` *numbers*. That is a deliberate
 * security property, not a style choice: a theme is stored and transported as
 * three numbers per colour, never as a CSS string. `formatOklch` is the only
 * place a colour becomes text, and it can only ever emit digits. CSS injection
 * through the theme is therefore structurally impossible rather than
 * validated-against — there is no code path where admin input reaches a
 * stylesheet as text.
 */

/** A colour in OKLCH. `l` 0–1, `c` 0–~0.4, `h` degrees 0–360. */
export type Oklch = { l: number; c: number; h: number };

/** Chroma above this is outside sRGB for every hue, so it is wasted range. */
const MAX_CHROMA = 0.4;

export function clampOklch({ l, c, h }: Oklch): Oklch {
  return {
    l: clamp(l, 0, 1),
    c: clamp(c, 0, MAX_CHROMA),
    // Normalise rather than clamp — hue is circular, so 370° is 10°, not 360°.
    h: ((h % 360) + 360) % 360,
  };
}

function clamp(n: number, min: number, max: number): number {
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;
}

/** Round to `places` without exponent notation, so the CSS is always literal. */
function round(n: number, places: number): number {
  const f = 10 ** places;
  return Math.round(n * f) / f;
}

/**
 * The only colour → text conversion in the codebase.
 *
 * Inputs are clamped and rounded first, so the output is always a well-formed
 * `oklch(...)` function of three finite numbers. There is no interpolation of
 * caller-supplied text.
 */
export function formatOklch(color: Oklch): string {
  const { l, c, h } = clampOklch(color);
  return `oklch(${round(l, 4)} ${round(c, 4)} ${round(h, 2)})`;
}

// ---------------------------------------------------------------------------
// OKLCH → sRGB
//
// OKLCH is OKLab in polar form. OKLab → sRGB is two matrix multiplies with a
// cube in between (Björn Ottosson's published constants), then the sRGB
// transfer function. Kept as explicit constants rather than a matrix helper —
// they are read far more often than they are changed.
// ---------------------------------------------------------------------------

/** Linear-light sRGB, unclamped — may fall outside 0–1 when out of gamut. */
function oklchToLinearSrgb(color: Oklch): [number, number, number] {
  const { l: L, c: C, h: H } = clampOklch(color);
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  // OKLab → non-linear LMS
  const lCbrt = L + 0.3963377774 * a + 0.2158037573 * b;
  const mCbrt = L - 0.1055613458 * a - 0.0638541728 * b;
  const sCbrt = L - 0.0894841775 * a - 1.291485548 * b;

  const lLms = lCbrt ** 3;
  const mLms = mCbrt ** 3;
  const sLms = sCbrt ** 3;

  return [
    4.0767416621 * lLms - 3.3077115913 * mLms + 0.2309699292 * sLms,
    -1.2684380046 * lLms + 2.6097574011 * mLms - 0.3413193965 * sLms,
    -0.0041960863 * lLms - 0.7034186147 * mLms + 1.707614701 * sLms,
  ];
}

/** sRGB transfer function (linear → gamma-encoded), per IEC 61966-2-1. */
function encodeGamma(channel: number): number {
  const v = clamp(channel, 0, 1);
  return v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
}

/** Inverse of {@link encodeGamma}. */
function decodeGamma(channel: number): number {
  const v = clamp(channel, 0, 1);
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

/** 8-bit sRGB, gamut-clipped. */
export function oklchToRgb(color: Oklch): [number, number, number] {
  return oklchToLinearSrgb(color).map((ch) =>
    Math.round(encodeGamma(ch) * 255)
  ) as [number, number, number];
}

/** `#rrggbb`. Only for the admin's hex field — never for stylesheet output. */
export function oklchToHex(color: Oklch): string {
  return `#${oklchToRgb(color)
    .map((ch) => ch.toString(16).padStart(2, "0"))
    .join("")}`;
}

/**
 * True when the colour cannot be shown in sRGB and had to be clipped.
 *
 * The admin UI uses this to steer a picked hue back into a displayable chroma
 * instead of silently rendering something other than what was chosen.
 */
export function isOutOfGamut(color: Oklch): boolean {
  return oklchToLinearSrgb(color).some((ch) => ch < -1e-4 || ch > 1 + 1e-4);
}

/**
 * Highest chroma that stays in sRGB for this lightness and hue.
 *
 * Bisection rather than an analytic solve: the gamut boundary in OKLCH has no
 * closed form, and 20 iterations lands within ~4e-7 — far below the 4 decimal
 * places `formatOklch` emits.
 */
export function maxChromaFor(l: number, h: number): number {
  let lo = 0;
  let hi = MAX_CHROMA;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    if (isOutOfGamut({ l, c: mid, h })) hi = mid;
    else lo = mid;
  }
  return lo;
}

/** Pulls chroma down to the gamut boundary, preserving lightness and hue. */
export function fitToGamut(color: Oklch): Oklch {
  const fitted = clampOklch(color);
  if (!isOutOfGamut(fitted)) return fitted;
  return { ...fitted, c: maxChromaFor(fitted.l, fitted.h) };
}

// ---------------------------------------------------------------------------
// Relative luminance
// ---------------------------------------------------------------------------

/**
 * WCAG relative luminance (0–1).
 *
 * Deliberately round-trips through gamma encode → clip → decode rather than
 * using the linear values straight from the matrix. An out-of-gamut colour is
 * *displayed* clipped, so its real on-screen contrast is the clipped one.
 * Skipping the clip would report a ratio no monitor can actually produce, and
 * the accessibility guarantee would be fiction.
 */
export function relativeLuminance(color: Oklch): number {
  const [r, g, b] = oklchToLinearSrgb(color).map((ch) =>
    decodeGamma(encodeGamma(ch))
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// ---------------------------------------------------------------------------
// Small manipulations used by the derivation rules
// ---------------------------------------------------------------------------

/** Move lightness by `delta`, keeping hue and chroma. */
export function shiftLightness(color: Oklch, delta: number): Oklch {
  return clampOklch({ ...color, l: color.l + delta });
}

/** Scale chroma by `factor` — keeps neutral greys neutral (0 × k === 0). */
export function scaleChroma(color: Oklch, factor: number): Oklch {
  return clampOklch({ ...color, c: color.c * factor });
}

/** True for colours a dark foreground should sit on. */
export function isLight(color: Oklch): boolean {
  return relativeLuminance(color) > 0.18;
}
