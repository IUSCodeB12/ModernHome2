import { describe, expect, it } from "vitest";
import {
  AA_LARGE,
  AA_TEXT,
  AAA_TEXT,
  checkContrast,
  contrastRatio,
  gradeContrast,
  readableOn,
  solveForContrast,
} from "@/lib/theme/contrast";
import type { Oklch } from "@/lib/theme/oklch";

const WHITE: Oklch = { l: 1, c: 0, h: 0 };
const BLACK: Oklch = { l: 0, c: 0, h: 0 };

/** A spread wide enough to catch rules that only hold for warm mid-tones. */
function sweep(): Oklch[] {
  const colors: Oklch[] = [];
  for (let h = 0; h < 360; h += 30) {
    for (const l of [0.12, 0.3, 0.5, 0.62, 0.78, 0.94]) {
      for (const c of [0, 0.06, 0.16, 0.3]) colors.push({ l, c, h });
    }
  }
  return colors;
}

describe("contrastRatio", () => {
  it("hits the WCAG bounds", () => {
    expect(contrastRatio(WHITE, BLACK)).toBeCloseTo(21, 2);
    expect(contrastRatio(WHITE, WHITE)).toBeCloseTo(1, 6);
  });

  it("is symmetric", () => {
    const a = { l: 0.3, c: 0.1, h: 40 };
    const b = { l: 0.9, c: 0.02, h: 200 };
    expect(contrastRatio(a, b)).toBeCloseTo(contrastRatio(b, a), 10);
  });

  it("matches the known ratio of the live palette's body text", () => {
    // --foreground on --background from app/globals.css, comfortably AAA.
    const ratio = contrastRatio(
      { l: 0.21, c: 0.014, h: 55 },
      { l: 0.988, c: 0.005, h: 84 }
    );
    expect(ratio).toBeGreaterThan(AAA_TEXT);
  });
});

describe("gradeContrast", () => {
  it("labels each band at its boundary", () => {
    expect(gradeContrast(21)).toBe("AAA");
    expect(gradeContrast(AAA_TEXT)).toBe("AAA");
    expect(gradeContrast(AA_TEXT)).toBe("AA");
    expect(gradeContrast(AA_LARGE)).toBe("AA Large");
    expect(gradeContrast(2.99)).toBe("Fail");
  });
});

describe("solveForContrast", () => {
  it("reaches the target against both light and dark grounds", () => {
    for (const background of [WHITE, BLACK, { l: 0.5, c: 0.1, h: 250 }]) {
      for (const color of sweep()) {
        const solved = solveForContrast(color, background, AA_TEXT);
        if (solved === null) continue;
        expect(contrastRatio(solved, background)).toBeGreaterThanOrEqual(
          AA_TEXT - 1e-6
        );
      }
    }
  });

  it("holds hue and chroma so the fix reads as a correction, not a swap", () => {
    const color = { l: 0.7, c: 0.14, h: 46 };
    const solved = solveForContrast(color, WHITE, AA_TEXT);
    expect(solved).not.toBeNull();
    expect(solved!.h).toBeCloseTo(color.h, 6);
    expect(solved!.c).toBeCloseTo(color.c, 6);
  });

  it("moves as little as possible, so it stays near what was picked", () => {
    const color = { l: 0.62, c: 0.1, h: 250 };
    const solved = solveForContrast(color, WHITE, AA_TEXT)!;
    // Just past the threshold rather than slammed to black.
    expect(contrastRatio(solved, WHITE)).toBeLessThan(AA_TEXT + 0.05);
  });

  it("leaves an already-passing colour essentially where it was", () => {
    const color = { l: 0.2, c: 0.01, h: 55 };
    const solved = solveForContrast(color, WHITE, AA_TEXT)!;
    expect(solved.l).toBeCloseTo(color.l, 4);
  });

  it("returns null when no lightness at that hue can reach the target", () => {
    // Mid-grey ground: nothing clears 7:1 in either direction.
    expect(solveForContrast({ l: 0.5, c: 0, h: 0 }, { l: 0.5, c: 0, h: 0 }, AAA_TEXT)).toBeNull();
  });
});

describe("checkContrast", () => {
  it("reports a pass without offering a fix", () => {
    const result = checkContrast(BLACK, WHITE);
    expect(result.passes).toBe(true);
    expect(result.grade).toBe("AAA");
    expect(result.suggestion).toBeUndefined();
  });

  it("offers a suggestion that actually passes", () => {
    const result = checkContrast({ l: 0.88, c: 0.05, h: 82 }, WHITE);
    expect(result.passes).toBe(false);
    expect(result.suggestion).toBeDefined();
    expect(contrastRatio(result.suggestion!, WHITE)).toBeGreaterThanOrEqual(
      AA_TEXT - 1e-6
    );
  });
});

describe("readableOn", () => {
  it("always returns AA text for any surface in the sweep", () => {
    for (const surface of sweep()) {
      const ratio = contrastRatio(readableOn(surface), surface);
      expect(ratio).toBeGreaterThanOrEqual(AA_TEXT - 1e-6);
    }
  });

  it("tints toward the surface hue instead of defaulting to pure black", () => {
    const label = readableOn({ l: 0.755, c: 0.095, h: 82 });
    expect(label.c).toBeGreaterThan(0);
    expect(label.h).toBeCloseTo(82, 6);
  });

  it("flips to light text on dark fills", () => {
    const onDark = readableOn({ l: 0.245, c: 0.016, h: 55 });
    const onLight = readableOn({ l: 0.95, c: 0.01, h: 55 });
    expect(onDark.l).toBeGreaterThan(0.5);
    expect(onLight.l).toBeLessThan(0.5);
  });
});
