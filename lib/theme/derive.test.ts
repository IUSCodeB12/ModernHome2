import { describe, expect, it } from "vitest";
import { AA_LARGE, AA_TEXT, contrastRatio } from "@/lib/theme/contrast";
import { deriveDark, deriveTheme, deriveTokens } from "@/lib/theme/derive";
import { isOutOfGamut } from "@/lib/theme/oklch";
import { THEME_PRESETS } from "@/lib/theme/presets";
import { DEFAULT_THEME, TOKEN_NAMES, type ThemePalette } from "@/lib/theme/tokens";

/**
 * The pairings a visitor actually reads, as [text token, surface token].
 * Every one of these must clear AA in every theme, in both modes.
 */
const TEXT_PAIRS = [
  ["foreground", "background"],
  ["card-foreground", "card"],
  ["popover-foreground", "popover"],
  ["muted-foreground", "background"],
  ["muted-foreground", "muted"],
  ["primary-foreground", "primary"],
  ["brand-foreground", "brand"],
  ["secondary-foreground", "secondary"],
  ["accent-foreground", "accent"],
] as const;

/** Palettes an admin could plausibly land on, including awkward ones. */
function palettes(): ThemePalette[] {
  const out: ThemePalette[] = [];
  for (let h = 0; h < 360; h += 45) {
    for (const c of [0, 0.02, 0.12]) {
      out.push({
        background: { l: 0.98, c: c * 0.2, h },
        foreground: { l: 0.2, c: c * 0.3, h },
        primary: { l: 0.28, c, h },
        brand: { l: 0.7, c, h },
      });
    }
  }
  return out;
}

describe("deriveDark", () => {
  it("reproduces the hand-tuned house lightness and chroma", () => {
    // app/globals.css `.dark` — the values this rule set was fitted to.
    const house = {
      background: { l: 0.165, c: 0.008 },
      foreground: { l: 0.955, c: 0.006 },
      primary: { l: 0.945, c: 0.007 },
      brand: { l: 0.8, c: 0.1 },
    };
    const derived = deriveDark(DEFAULT_THEME.light);
    for (const key of ["background", "foreground", "primary", "brand"] as const) {
      expect(derived[key].l).toBeCloseTo(house[key].l, 4);
      expect(derived[key].c).toBeCloseTo(house[key].c, 3);
    }
  });

  it("carries each token's own hue across, so dark reads as the same brand", () => {
    const derived = deriveDark(DEFAULT_THEME.light);
    expect(derived.background.h).toBeCloseTo(DEFAULT_THEME.light.background.h, 6);
    expect(derived.brand.h).toBeCloseTo(DEFAULT_THEME.light.brand.h, 6);
  });

  it("inverts primary so a solid button stays loudest in both modes", () => {
    const dark = deriveDark(DEFAULT_THEME.light);
    expect(DEFAULT_THEME.light.primary.l).toBeLessThan(0.5);
    expect(dark.primary.l).toBeGreaterThan(0.5);
  });

  it("keeps a neutral theme neutral", () => {
    const dark = deriveDark({
      background: { l: 0.99, c: 0, h: 0 },
      foreground: { l: 0.2, c: 0, h: 0 },
      primary: { l: 0.25, c: 0, h: 0 },
      brand: { l: 0.6, c: 0, h: 0 },
    });
    for (const color of Object.values(dark)) expect(color.c).toBe(0);
  });
});

describe("deriveTokens", () => {
  it("emits every token the site paints with", () => {
    const tokens = deriveTokens(DEFAULT_THEME.light);
    for (const name of TOKEN_NAMES) expect(tokens[name]).toBeDefined();
  });

  it("never derives a colour outside sRGB from admin input", () => {
    for (const palette of palettes()) {
      for (const candidate of [palette, deriveDark(palette)]) {
        for (const [name, color] of Object.entries(deriveTokens(candidate))) {
          // `destructive` is a fixed constant carried verbatim from
          // globals.css, not derived — see the note on DESTRUCTIVE for why it
          // is left slightly out of gamut for the browser to clip.
          if (name === "destructive") continue;
          expect(
            isOutOfGamut(color),
            `${name} @ hue ${palette.brand.h} → ${JSON.stringify(color)}`
          ).toBe(false);
        }
      }
    }
  });

  it("separates raised and recessed surfaces from the page ground", () => {
    const light = deriveTokens(DEFAULT_THEME.light);
    expect(light.card.l).toBeGreaterThan(light.background.l);
    expect(light.muted.l).toBeLessThan(light.background.l);

    // Dark has no room below the ground, so both directions lift.
    const dark = deriveTokens(DEFAULT_THEME.dark!);
    expect(dark.card.l).toBeGreaterThan(dark.background.l);
    expect(dark.muted.l).toBeGreaterThan(dark.background.l);
  });

  it("mutes secondary text as far as AA allows on the hardest surface it lands on", () => {
    const tokens = deriveTokens(DEFAULT_THEME.light);
    // Accent is the extreme recessed surface, so it sets the limit...
    const onAccent = contrastRatio(tokens["muted-foreground"], tokens.accent);
    expect(onAccent).toBeGreaterThanOrEqual(AA_TEXT - 1e-6);
    expect(onAccent).toBeLessThan(AA_TEXT + 0.05);
    // ...and the page ground then clears it with room to spare.
    expect(
      contrastRatio(tokens["muted-foreground"], tokens.background)
    ).toBeGreaterThan(AA_TEXT);
  });

  it("gives the focus ring the 3:1 WCAG asks of a non-text boundary", () => {
    for (const palette of palettes()) {
      const tokens = deriveTokens(palette);
      expect(
        contrastRatio(tokens.ring, tokens.background)
      ).toBeGreaterThanOrEqual(AA_LARGE - 1e-6);
    }
  });

  it("leaves danger red alone — it is not the admin's to restyle", () => {
    const a = deriveTokens(DEFAULT_THEME.light);
    const b = deriveTokens(THEME_PRESETS[3].tokens.light);
    expect(a.destructive).toEqual(b.destructive);
  });

  /**
   * The load-bearing guarantee: derived text is *solved* for contrast, so no
   * combination of authored colours can produce unreadable secondary text,
   * button labels or badge text.
   */
  it("keeps every derived text pairing at AA across the sweep", () => {
    for (const palette of palettes()) {
      for (const candidate of [palette, deriveDark(palette)]) {
        const tokens = deriveTokens(candidate);
        for (const [text, surface] of TEXT_PAIRS) {
          // foreground-on-background is the admin's own pair, validated at
          // publish time rather than silently corrected here.
          if (text === "foreground") continue;
          expect(
            contrastRatio(tokens[text], tokens[surface]),
            `${text} on ${surface} (hue ${palette.brand.h})`
          ).toBeGreaterThanOrEqual(AA_TEXT - 1e-6);
        }
      }
    }
  });
});

describe("deriveTheme", () => {
  it("derives a dark palette when none is authored", () => {
    const theme = deriveTheme({ ...DEFAULT_THEME, dark: null });
    expect(theme.dark.background.l).toBeLessThan(0.3);
  });

  it("prefers an authored dark palette over a derived one", () => {
    const authored = deriveTheme(DEFAULT_THEME);
    const derived = deriveTheme({ ...DEFAULT_THEME, dark: null });
    expect(authored.dark.background.h).not.toBeCloseTo(
      derived.dark.background.h,
      1
    );
  });

  it("clamps radius to a sane range", () => {
    expect(deriveTheme({ ...DEFAULT_THEME, radius: 99 }).radius).toBe(2);
    expect(deriveTheme({ ...DEFAULT_THEME, radius: -1 }).radius).toBe(0);
  });

  it("resolves fonts to a stack with a fallback", () => {
    const theme = deriveTheme(DEFAULT_THEME);
    expect(theme.fonts.display).toContain("var(--font-fraunces)");
    expect(theme.fonts.display).toContain("serif");
  });
});

describe("presets", () => {
  it("ships five", () => {
    expect(THEME_PRESETS).toHaveLength(5);
  });

  it("uses unique ids", () => {
    const ids = THEME_PRESETS.map((preset) => preset.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps Ivory identical to the locked fallback", () => {
    expect(THEME_PRESETS[0].tokens).toBe(DEFAULT_THEME);
  });

  /**
   * Presets are the one-click path, so they carry the strongest promise: every
   * pairing including the authored foreground-on-background must clear AA in
   * both modes. A new preset that fails is a failing test, not a judgement call.
   */
  it("passes WCAG AA on every text pairing, in both modes", () => {
    for (const preset of THEME_PRESETS) {
      const theme = deriveTheme(preset.tokens);
      for (const mode of ["light", "dark"] as const) {
        for (const [text, surface] of TEXT_PAIRS) {
          expect(
            contrastRatio(theme[mode][text], theme[mode][surface]),
            `${preset.id}: ${text} on ${surface} (${mode})`
          ).toBeGreaterThanOrEqual(AA_TEXT - 1e-6);
        }
      }
    }
  });
});
