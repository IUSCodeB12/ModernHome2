/**
 * WCAG contrast, and the solver that makes failing themes unreachable.
 *
 * The brief for this feature is that an admin must never be able to publish an
 * unreadable site. There are two ways to honour that: check the admin's choice
 * and nag, or *derive* every text colour by solving for a passing ratio. This
 * module does the second, and the admin UI uses the first only for the handful
 * of colours the admin picks directly (their own text-on-background pair).
 *
 * So contrast here is not a validation layer bolted on at save time — it is how
 * `derive.ts` picks colours in the first place. See `deriveTokens`.
 */

import {
  type Oklch,
  clampOklch,
  fitToGamut,
  isLight,
  relativeLuminance,
} from "@/lib/theme/oklch";

/** WCAG 2.1 AA: normal body text. */
export const AA_TEXT = 4.5;
/** WCAG 2.1 AA: text ≥18.66px bold or ≥24px, and UI component boundaries. */
export const AA_LARGE = 3;
/** WCAG 2.1 AAA: normal body text. */
export const AAA_TEXT = 7;

/**
 * Contrast ratio between two colours, 1–21.
 *
 * Symmetric, so argument order never matters to the result.
 */
export function contrastRatio(a: Oklch, b: Oklch): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

export type ContrastGrade = "AAA" | "AA" | "AA Large" | "Fail";

/** The badge shown beside each colour field in the admin UI. */
export function gradeContrast(ratio: number): ContrastGrade {
  if (ratio >= AAA_TEXT) return "AAA";
  if (ratio >= AA_TEXT) return "AA";
  if (ratio >= AA_LARGE) return "AA Large";
  return "Fail";
}

export type ContrastCheck = {
  ratio: number;
  grade: ContrastGrade;
  passes: boolean;
  /** Present only when `passes` is false — the nearest colour that would pass. */
  suggestion?: Oklch;
};

/**
 * Checks `color` against `against` and, on failure, offers a fix.
 *
 * The suggestion keeps hue and chroma and moves lightness only, so the
 * "auto-fix" button reads as the same colour corrected rather than a different
 * colour substituted — which is what makes it something an admin will accept
 * instead of dismiss.
 */
export function checkContrast(
  color: Oklch,
  against: Oklch,
  target: number = AA_TEXT
): ContrastCheck {
  const ratio = contrastRatio(color, against);
  const passes = ratio >= target;
  const check: ContrastCheck = {
    ratio,
    grade: gradeContrast(ratio),
    passes,
  };
  if (!passes) {
    const fixed = solveForContrast(color, against, target);
    // Only offer it if it actually got there — on a mid-lightness background
    // some hues cannot reach AAA in either direction.
    if (fixed && contrastRatio(fixed, against) >= target) check.suggestion = fixed;
  }
  return check;
}

/**
 * Finds the nearest lightness of `color` that hits `target` against `against`.
 *
 * Bisection on L. Luminance is monotonic in OKLCH lightness for a fixed hue and
 * chroma, so contrast against a fixed background is monotonic on each side of
 * the background's own lightness — which makes bisection exact rather than a
 * heuristic. 24 iterations resolves L to ~6e-8.
 *
 * Every candidate is evaluated *after* gamut fitting, never before. Moving
 * lightness can push a chroma that was fine at the old lightness outside sRGB,
 * and fitting reduces chroma, which shifts luminance — so a ratio measured on
 * the unfitted colour can be materially wrong (0.29 vs 0.24 for a saturated
 * green, in `oklch.test.ts`). Measuring the colour that will actually be
 * emitted is what makes the returned value's guarantee real. The short walk
 * afterwards covers the rare case where fitting breaks strict monotonicity.
 *
 * Direction is chosen rather than guessed: whichever of "push toward black" or
 * "push toward white" can reach the target wins, and when both can, the one
 * requiring the smaller move wins, so the result stays close to what was picked.
 *
 * Returns null when neither direction reaches the target — that only happens
 * for high targets against a mid-lightness background, where no colour of any
 * hue would pass.
 */
export function solveForContrast(
  color: Oklch,
  against: Oklch,
  target: number = AA_TEXT
): Oklch | null {
  const base = clampOklch(color);
  const at = (l: number) => fitToGamut({ ...base, l });
  const candidates: Oklch[] = [];

  for (const bound of [0, 1]) {
    // Does this direction reach the target at its extreme?
    if (contrastRatio(at(bound), against) < target) continue;

    let lo = base.l; // may fail
    let hi = bound; // known to pass
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (contrastRatio(at(mid), against) >= target) hi = mid;
      else lo = mid;
    }

    // Creep the last fraction toward the bound if fitting left us just short.
    let steps = 0;
    while (contrastRatio(at(hi), against) < target && steps++ < 64) {
      hi += (bound - hi) * 0.05;
    }
    candidates.push(at(hi));
  }

  if (candidates.length === 0) return null;
  // Smallest move from the colour the admin actually chose.
  return candidates.sort(
    (a, b) => Math.abs(a.l - base.l) - Math.abs(b.l - base.l)
  )[0];
}

/**
 * Picks readable text for a filled surface — button labels, badge text.
 *
 * Starts from a tinted near-white or near-black rather than pure #fff/#000: the
 * live palette's `--brand-foreground` is a dark walnut carrying the brand hue,
 * not black, and that warmth is most of why the buttons look considered. The
 * tint is a tenth of the surface's own chroma, enough to relate without
 * muddying.
 *
 * Guaranteed to return a passing colour where one exists, because it finishes
 * by solving rather than by hoping the starting point was good enough.
 */
export function readableOn(surface: Oklch, target: number = AA_TEXT): Oklch {
  const tint = surface.c * 0.1;
  const dark = fitToGamut({ l: 0.21, c: tint, h: surface.h });
  const light = fitToGamut({ l: 0.985, c: tint, h: surface.h });

  // Prefer the one that already reads better on this surface.
  const preferred = isLight(surface) ? dark : light;
  const fallback = isLight(surface) ? light : dark;

  if (contrastRatio(preferred, surface) >= target) return preferred;

  const solved = solveForContrast(preferred, surface, target);
  if (solved) return solved;

  const solvedFallback = solveForContrast(fallback, surface, target);
  if (solvedFallback) return solvedFallback;

  // Nothing at this hue passes — take the better of the two extremes rather
  // than returning something that fails silently.
  return contrastRatio(dark, surface) >= contrastRatio(light, surface)
    ? dark
    : light;
}
