import { describe, expect, it } from "vitest";
import {
  clampOklch,
  fitToGamut,
  formatOklch,
  isOutOfGamut,
  maxChromaFor,
  oklchToHex,
  oklchToRgb,
  relativeLuminance,
  scaleChroma,
  shiftLightness,
} from "@/lib/theme/oklch";

describe("oklch → sRGB", () => {
  it("maps the achromatic endpoints exactly", () => {
    expect(oklchToRgb({ l: 1, c: 0, h: 0 })).toEqual([255, 255, 255]);
    expect(oklchToRgb({ l: 0, c: 0, h: 0 })).toEqual([0, 0, 0]);
  });

  it("round-trips the sRGB primaries", () => {
    // Reference OKLCH coordinates for #f00 / #0f0 / #00f.
    const cases: Array<[Parameters<typeof oklchToRgb>[0], string]> = [
      [{ l: 0.6279, c: 0.2577, h: 29.23 }, "#ff0000"],
      [{ l: 0.8664, c: 0.2948, h: 142.5 }, "#00ff00"],
      [{ l: 0.452, c: 0.3132, h: 264.05 }, "#0000ff"],
    ];
    for (const [color, hex] of cases) {
      const [r, g, b] = oklchToRgb(color);
      const [er, eg, eb] = [1, 3, 5].map((i) =>
        parseInt(hex.slice(i, i + 2), 16)
      );
      // ±2/255 absorbs the rounding in the published reference coordinates.
      expect(Math.abs(r - er)).toBeLessThanOrEqual(2);
      expect(Math.abs(g - eg)).toBeLessThanOrEqual(2);
      expect(Math.abs(b - eb)).toBeLessThanOrEqual(2);
    }
  });

  it("produces a six-digit hex for in-gamut colours", () => {
    expect(oklchToHex({ l: 0.988, c: 0.005, h: 84 })).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe("formatOklch", () => {
  it("emits only digits, so no admin input can reach a stylesheet as text", () => {
    // Hostile values standing in for anything that survived a bad validator.
    const hostile = {
      l: Number.NaN,
      c: Number.POSITIVE_INFINITY,
      h: -Number.MAX_VALUE,
    };
    expect(formatOklch(hostile)).toMatch(/^oklch\(-?[\d.]+ -?[\d.]+ -?[\d.]+\)$/);
  });

  it("clamps out-of-range lightness and chroma", () => {
    expect(formatOklch({ l: 5, c: 9, h: 0 })).toBe("oklch(1 0.4 0)");
    expect(formatOklch({ l: -5, c: -9, h: 0 })).toBe("oklch(0 0 0)");
  });

  it("normalises hue around the circle rather than clamping it", () => {
    expect(clampOklch({ l: 0.5, c: 0.1, h: 370 }).h).toBeCloseTo(10, 6);
    expect(clampOklch({ l: 0.5, c: 0.1, h: -10 }).h).toBeCloseTo(350, 6);
  });

  it("never uses exponent notation, which CSS would not parse", () => {
    expect(formatOklch({ l: 0.00001, c: 0.00001, h: 0.00001 })).not.toContain(
      "e"
    );
  });
});

describe("gamut fitting", () => {
  it("flags colours sRGB cannot show", () => {
    expect(isOutOfGamut({ l: 0.6, c: 0.35, h: 140 })).toBe(true);
    expect(isOutOfGamut({ l: 0.6, c: 0.02, h: 140 })).toBe(false);
  });

  it("brings any hue back in gamut while holding lightness and hue", () => {
    for (let h = 0; h < 360; h += 15) {
      const fitted = fitToGamut({ l: 0.62, c: 0.4, h });
      expect(isOutOfGamut(fitted)).toBe(false);
      expect(fitted.l).toBeCloseTo(0.62, 6);
      expect(fitted.h).toBeCloseTo(h, 6);
    }
  });

  it("leaves in-gamut colours untouched", () => {
    const safe = { l: 0.755, c: 0.095, h: 82 };
    expect(fitToGamut(safe)).toEqual(safe);
  });

  it("finds the actual chroma boundary for a hue", () => {
    const [l, h] = [0.6, 260];
    const max = maxChromaFor(l, h);
    expect(isOutOfGamut({ l, c: max, h })).toBe(false);
    expect(isOutOfGamut({ l, c: max + 0.005, h })).toBe(true);
  });

  it("has more chroma headroom at mid lightness than near white", () => {
    expect(maxChromaFor(0.6, 260)).toBeGreaterThan(maxChromaFor(0.97, 260));
  });
});

describe("relative luminance", () => {
  it("anchors at the endpoints WCAG defines", () => {
    expect(relativeLuminance({ l: 1, c: 0, h: 0 })).toBeCloseTo(1, 3);
    expect(relativeLuminance({ l: 0, c: 0, h: 0 })).toBeCloseTo(0, 6);
  });

  it("rises monotonically with lightness", () => {
    let previous = -1;
    for (let l = 0; l <= 1.0001; l += 0.05) {
      const current = relativeLuminance({ l, c: 0.05, h: 82 });
      expect(current).toBeGreaterThan(previous);
      previous = current;
    }
  });

  it("reports the luminance of the clipped colour a screen actually shows", () => {
    // An out-of-gamut colour is displayed clipped, so that is the only
    // luminance an accessibility guarantee may be built on. Recomputing from
    // the 8-bit output proves the clip happens inside relativeLuminance.
    const wild = { l: 0.6, c: 0.4, h: 140 };
    const [r, g, b] = oklchToRgb(wild).map((channel) => {
      const v = channel / 255;
      return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    expect(relativeLuminance(wild)).toBeCloseTo(
      0.2126 * r + 0.7152 * g + 0.0722 * b,
      3
    );
  });
});

describe("manipulations", () => {
  it("keeps neutrals neutral when scaling chroma", () => {
    expect(scaleChroma({ l: 0.5, c: 0, h: 200 }, 4).c).toBe(0);
  });

  it("clamps lightness shifts at the ends of the scale", () => {
    expect(shiftLightness({ l: 0.98, c: 0.01, h: 84 }, 0.5).l).toBe(1);
    expect(shiftLightness({ l: 0.02, c: 0.01, h: 84 }, -0.5).l).toBe(0);
  });
});
