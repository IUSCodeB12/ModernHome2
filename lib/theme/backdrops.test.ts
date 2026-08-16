import { describe, expect, it } from "vitest";
import {
  BACKDROPS,
  BACKDROP_IDS,
  type BackdropId,
  backdropCss,
  backdropPeakAlpha,
  backdropSize,
  backdropWorstCase,
} from "@/lib/theme/backdrops";
import { AA_TEXT, contrastRatio } from "@/lib/theme/contrast";
import { deriveTheme } from "@/lib/theme/derive";
import { THEME_PRESETS } from "@/lib/theme/presets";
import { DEFAULT_THEME } from "@/lib/theme/tokens";

const DESIGNS = BACKDROP_IDS.filter((id) => id !== "none");

describe("catalogue", () => {
  it("offers five designs plus None", () => {
    expect(DESIGNS).toHaveLength(5);
    expect(BACKDROPS).toHaveLength(6);
  });

  it("describes every id exactly once", () => {
    expect(BACKDROPS.map((b) => b.id).sort()).toEqual([...BACKDROP_IDS].sort());
  });
});

describe("backdropCss", () => {
  it("emits nothing for None", () => {
    const theme = deriveTheme({ ...DEFAULT_THEME, backdrop: "none" });
    expect(theme.backdrop.light).toBe("none");
    expect(theme.backdrop.dark).toBe("none");
  });

  it("produces a usable background-image for every design", () => {
    const { light } = deriveTheme(DEFAULT_THEME);
    for (const id of DESIGNS) {
      const css = backdropCss(light, id);
      expect(css, id).not.toBe("none");
      expect(css.length, id).toBeGreaterThan(20);
    }
  });

  /**
   * The injection-proof property, extended to the decorative layer: colours
   * reach the stylesheet only through `formatOklchAlpha`, so nothing outside
   * gradient syntax, numbers and the one fixed SVG constant can appear.
   */
  it("contains no characters that could escape a declaration", () => {
    const { light, dark } = deriveTheme(DEFAULT_THEME);
    for (const palette of [light, dark]) {
      for (const id of DESIGNS) {
        const css = backdropCss(palette, id);
        expect(css, id).not.toMatch(/[;{}]|<\/|javascript:|expression\(/i);
      }
    }
  });

  it("re-tints with the palette rather than baking in a fixed colour", () => {
    const warm = deriveTheme({ ...DEFAULT_THEME, backdrop: "aurora" });
    const cool = deriveTheme({
      ...DEFAULT_THEME,
      backdrop: "aurora",
      light: {
        ...DEFAULT_THEME.light,
        brand: { l: 0.7, c: 0.13, h: 205 },
      },
    });
    expect(warm.backdrop.light).not.toBe(cool.backdrop.light);
    expect(cool.backdrop.light).toContain("205");
  });

  /**
   * Regression: grain's SVG carried a fixed 0.55 opacity while its PEAK entry
   * claimed 0.05, so it rendered about ten times heavier than the value its own
   * contrast proof checked. The proof passed and the page was wrong. Nothing in
   * the token sweep could see it — only the rendered alpha and the declared one
   * agreeing makes the guarantee real.
   */
  it("renders grain at exactly the alpha its contrast proof assumes", () => {
    const theme = deriveTheme({ ...DEFAULT_THEME, backdrop: "grain" });
    for (const mode of ["light", "dark"] as const) {
      const declared = backdropPeakAlpha(theme[mode], "grain");
      const rendered = Number(
        /opacity='([\d.]+)'/.exec(theme.backdrop[mode])?.[1]
      );
      expect(rendered, mode).toBeCloseTo(declared, 6);
    }
  });

  it("keeps every gradient layer at or under the declared peak", () => {
    const theme = deriveTheme(DEFAULT_THEME);
    for (const id of DESIGNS) {
      for (const mode of ["light", "dark"] as const) {
        const palette = theme[mode];
        const css = backdropCss(palette, id);
        const peak = backdropPeakAlpha(palette, id);
        for (const [, alpha] of css.matchAll(/\/\s*([\d.]+)\)/g)) {
          expect(Number(alpha), `${id}/${mode}`).toBeLessThanOrEqual(
            peak + 1e-9
          );
        }
      }
    }
  });

  /**
   * Tiling is what makes these viewport-scaled instead of stretching with the
   * page — but a layer still carrying colour where two tiles meet stacks with
   * its neighbour into a bright band, once per tile, all the way down.
   *
   * So every gradient must complete its falloff inside the tile. For
   * `radial-gradient(w h at x y%, …, transparent t%)` the vertical reach is
   * `h × t` either side of `y`, and both ends have to stay on the tile.
   */
  it("has no layer that would seam when tiled", () => {
    const { light } = deriveTheme(DEFAULT_THEME);
    const tiled = (["aurora", "mesh", "spotlight"] as const);
    for (const id of tiled) {
      const css = backdropCss(light, id);
      const layers = [
        ...css.matchAll(
          // `.*?` rather than `[^)]*?`: the colour is an `oklch(… / a)`
          // function, so the layer contains parentheses of its own.
          /radial-gradient\(\s*[\d.]+%\s+([\d.]+)%\s+at\s+[\d.]+%\s+(-?[\d.]+)%.*?transparent\s+([\d.]+)%/g
        ),
      ];
      expect(layers.length, `${id}: no layers parsed`).toBeGreaterThan(0);
      for (const [, radiusY, centreY, stop] of layers) {
        const reach = (Number(radiusY) * Number(stop)) / 100;
        const top = Number(centreY) - reach;
        const bottom = Number(centreY) + reach;
        expect(top, `${id} layer top`).toBeGreaterThanOrEqual(0);
        expect(bottom, `${id} layer bottom`).toBeLessThanOrEqual(100);
      }
    }
  });

  it("scales the tiled designs to the viewport, not the document", () => {
    for (const id of ["aurora", "mesh", "spotlight"] as const) {
      expect(backdropSize(id), id).toContain("vh");
    }
    // Grain and linen are already periodic; stretching them would distort them.
    for (const id of ["grain", "linen", "none"] as const) {
      expect(backdropSize(id), id).toBe("auto");
    }
  });

  it("paints dark grounds harder than light ones", () => {
    // The same alpha over near-black is far less visible than over ivory.
    const theme = deriveTheme({ ...DEFAULT_THEME, backdrop: "spotlight" });
    const alpha = (css: string) =>
      Number(/\/\s*([\d.]+)\)/.exec(css)?.[1] ?? 0);
    expect(alpha(theme.backdrop.dark)).toBeGreaterThan(
      alpha(theme.backdrop.light)
    );
  });
});

describe("contrast under a backdrop", () => {
  /**
   * The load-bearing test. Backdrops sit *behind* body text, so a heavy one
   * could push text below AA even while every token still passes in isolation —
   * a failure mode the token-level sweep cannot see. This composites each
   * design at its peak alpha and re-checks the text on top.
   */
  it("keeps body text at AA over every design, in every preset, both modes", () => {
    for (const preset of THEME_PRESETS) {
      for (const id of BACKDROP_IDS) {
        const theme = deriveTheme({ ...preset.tokens, backdrop: id });
        for (const mode of ["light", "dark"] as const) {
          const palette = theme[mode];
          const ground = backdropWorstCase(palette, id);
          expect(
            contrastRatio(palette.foreground, ground),
            `${preset.id} / ${id} / ${mode}`
          ).toBeGreaterThanOrEqual(AA_TEXT - 1e-6);
        }
      }
    }
  });

  it("keeps muted text at AA too — it has the least headroom", () => {
    for (const preset of THEME_PRESETS) {
      for (const id of BACKDROP_IDS) {
        const theme = deriveTheme({ ...preset.tokens, backdrop: id });
        for (const mode of ["light", "dark"] as const) {
          const palette = theme[mode];
          const ground = backdropWorstCase(palette, id);
          expect(
            contrastRatio(palette["muted-foreground"], ground),
            `${preset.id} / ${id} / ${mode}`
          ).toBeGreaterThanOrEqual(AA_TEXT - 1e-6);
        }
      }
    }
  });

  it("treats None as no change to the ground at all", () => {
    const { light } = deriveTheme(DEFAULT_THEME);
    expect(backdropWorstCase(light, "none")).toEqual(light.background);
  });

  it("moves the ground, so the check is not vacuous", () => {
    // Guards against a future refactor making backdropWorstCase a no-op and
    // the tests above passing for the wrong reason.
    const { light } = deriveTheme(DEFAULT_THEME);
    for (const id of DESIGNS) {
      const ground = backdropWorstCase(light, id as BackdropId);
      expect(ground, id).not.toEqual(light.background);
    }
  });
});
