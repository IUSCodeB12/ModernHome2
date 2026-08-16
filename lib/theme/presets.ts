/**
 * Five starting points, so an admin gets a finished-looking site in one click.
 *
 * Each is a complete `ThemeInput`, not a colour swatch — radius, font pairing
 * and default mode move together, because those are what separate a theme that
 * looks designed from four colours that happen to coexist.
 *
 * Only `Midnight` authors its own dark palette; the rest pass `dark: null` and
 * let `deriveDark` build one. That is the intended default, and the presets
 * model it deliberately: a derived dark mode inherits the light theme's hues,
 * so the site stays recognisable with the lights off.
 *
 * A note before adding a sixth: `themePresetsPass` in `presets.test.ts` walks
 * every preset through the full derivation in both modes and asserts WCAG AA on
 * each text pairing. A preset that fails is a failing test, not a design
 * opinion, so new entries get checked automatically.
 */

import { DEFAULT_THEME, type ThemeInput } from "@/lib/theme/tokens";

export type ThemePreset = {
  id: string;
  name: string;
  /** One line, shown under the name on the preset card. */
  description: string;
  tokens: ThemeInput;
};

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "ivory",
    name: "Ivory",
    description: "Warm ivory and walnut with an editorial serif. The house look.",
    // Shares the object with the locked fallback so "Reset to default" and
    // this card can never drift apart.
    tokens: DEFAULT_THEME,
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Cool near-neutral, tight corners, one restrained blue accent.",
    tokens: {
      ...DEFAULT_THEME,
      light: {
        background: { l: 0.995, c: 0.001, h: 250 },
        foreground: { l: 0.2, c: 0.008, h: 255 },
        primary: { l: 0.22, c: 0.01, h: 255 },
        brand: { l: 0.55, c: 0.13, h: 250 },
      },
      dark: null,
      radius: 0.375,
      fonts: { body: "geist", display: "geist" },
    },
  },
  {
    id: "bold",
    name: "Bold",
    description: "Deep ink, electric violet, high-contrast display serif.",
    tokens: {
      ...DEFAULT_THEME,
      light: {
        background: { l: 0.985, c: 0.004, h: 290 },
        foreground: { l: 0.155, c: 0.022, h: 288 },
        primary: { l: 0.19, c: 0.035, h: 288 },
        brand: { l: 0.56, c: 0.2, h: 292 },
      },
      dark: null,
      radius: 0.5,
      fonts: { body: "inter", display: "instrument-serif" },
    },
  },
  {
    id: "warm",
    name: "Warm",
    description: "Clay and terracotta, generous curves, soft editorial serif.",
    tokens: {
      ...DEFAULT_THEME,
      light: {
        background: { l: 0.985, c: 0.014, h: 62 },
        foreground: { l: 0.235, c: 0.028, h: 42 },
        primary: { l: 0.32, c: 0.055, h: 40 },
        brand: { l: 0.655, c: 0.145, h: 46 },
      },
      dark: null,
      radius: 1,
      fonts: { body: "geist", display: "fraunces" },
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Dark by default, cool slate ground, a teal accent that glows.",
    tokens: {
      ...DEFAULT_THEME,
      light: {
        background: { l: 0.97, c: 0.005, h: 240 },
        foreground: { l: 0.19, c: 0.014, h: 250 },
        primary: { l: 0.24, c: 0.018, h: 250 },
        brand: { l: 0.68, c: 0.115, h: 205 },
      },
      // The one preset authored dark-first, so its dark palette is designed
      // rather than derived — a derived one would only ever be the light
      // theme's reflection, and here the dark side is the point.
      dark: {
        background: { l: 0.17, c: 0.014, h: 250 },
        foreground: { l: 0.96, c: 0.005, h: 240 },
        primary: { l: 0.94, c: 0.01, h: 240 },
        brand: { l: 0.75, c: 0.12, h: 205 },
      },
      radius: 0.625,
      fonts: { body: "inter", display: "geist" },
      defaultMode: "dark",
    },
  },
];

export function getPreset(id: string): ThemePreset | undefined {
  return THEME_PRESETS.find((preset) => preset.id === id);
}
