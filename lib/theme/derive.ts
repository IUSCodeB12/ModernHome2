/**
 * Four authored colours → the twenty the site paints with.
 *
 * Two different rules are at work, and which one applies depends on whether a
 * token will ever have text on it.
 *
 * **Surfaces** (card, muted, border…) are lightness offsets from the page
 * background. Offsets rather than absolutes so a theme keeps its own character:
 * a warm ivory ground yields warm cards, a cool one yields cool cards, and a
 * neutral grey stays neutral because chroma is scaled, never added.
 *
 * **Text** (muted-foreground, primary-foreground, brand-foreground, ring) is
 * *solved* for a WCAG ratio rather than offset. That is the mechanism behind
 * the "admin cannot publish something unreadable" requirement: these colours
 * are not checked after the fact, they are computed as the nearest value that
 * passes. The only pair an admin can break is their own foreground-on-
 * background choice, which the editor warns about and the publish action blocks.
 *
 * The offsets below were read off the hand-tuned palette in `app/globals.css`
 * rather than invented, which is the evidence that these rules describe the
 * house style rather than merely a plausible one: feeding `DEFAULT_THEME.light`
 * through `deriveDark` reproduces the lightness and chroma of that file's
 * hand-written `.dark` block exactly, to four decimal places.
 *
 * It does *not* reproduce its hues, and that is intentional. The hand-tuned
 * dark block shuffles hues between tokens — the light ground sits at 84° and
 * the dark ground at 58°, while the foregrounds swap the other way. Derivation
 * carries each token's own hue across instead. Reshuffling is a judgement call
 * about one specific palette; carrying hue is the rule that keeps *any* palette
 * looking like itself with the lights off. `deriveDarkMatchesHouseLightness` in
 * `derive.test.ts` pins the part that is meant to match.
 */

import {
  AA_LARGE,
  AA_TEXT,
  contrastRatio,
  readableOn,
  solveForContrast,
} from "@/lib/theme/contrast";
import {
  type Oklch,
  clampOklch,
  fitToGamut,
  isLight,
  scaleChroma,
  shiftLightness,
} from "@/lib/theme/oklch";
import { backdropCss, backdropWorstCase, type BackdropId } from "@/lib/theme/backdrops";
import { fontStack } from "@/lib/theme/fonts";
import type {
  DerivedPalette,
  DerivedTheme,
  ThemeInput,
  ThemePalette,
} from "@/lib/theme/tokens";

/**
 * Surface steps away from the page ground, as [lightness delta, chroma factor].
 *
 * In light mode raised surfaces go up and recessed ones go down. In dark mode
 * everything goes *up*: there is no usable room below a near-black ground, so
 * separation has to come from lifting toward mid-grey. That asymmetry is why
 * this is two tables and not one with a flipped sign.
 */
const SURFACES = {
  light: {
    card: [0.007, 0.6],
    muted: [-0.026, 1.6],
    accent: [-0.033, 2.0],
    border: [-0.074, 2.0],
  },
  dark: {
    card: [0.043, 1.1],
    muted: [0.083, 1.1],
    accent: [0.11, 1.6],
    border: [0.125, 2.5],
  },
} as const satisfies Record<string, Record<string, readonly [number, number]>>;

/**
 * Not admin-editable. "Danger" has a learned meaning and a tradie's colour
 * preference is not a good enough reason to make a delete button green.
 *
 * Carried verbatim from `app/globals.css` — including the fact that the light
 * value sits a hair outside sRGB. It is deliberately *not* gamut-fitted: a
 * browser clips out-of-range channels, so clipping renders `#e7000b`, the red
 * already on the site, while fitting reduces chroma instead and lands on
 * `#e40016`, a visibly pinker one. Since this token is a fixed constant rather
 * than something derived from admin input, matching what ships today wins.
 */
const DESTRUCTIVE = {
  light: { l: 0.577, c: 0.245, h: 27.325 },
  dark: { l: 0.68, c: 0.19, h: 25 },
} as const;

function surface(
  background: Oklch,
  [deltaL, chromaFactor]: readonly [number, number]
): Oklch {
  return fitToGamut(
    scaleChroma(shiftLightness(background, deltaL), chromaFactor)
  );
}

/**
 * Text that recedes without becoming unreadable.
 *
 * Walks the foreground's lightness toward `worst` and stops at the last value
 * clearing `target` — so it is as quiet as WCAG AA permits and not one step
 * quieter. Bisection is exact here because contrast is monotonic in lightness
 * on each side of the surface's own lightness.
 *
 * `worst` is the *hardest* surface this text will ever sit on, not the page
 * ground. Muted text renders on background, card, muted and accent, and solving
 * against the ground alone put it at exactly 4.5:1 there and 4.17:1 on accent —
 * a quiet AA failure on every muted panel on the site. Accent is the extreme in
 * both modes (furthest from the ground: darkest in light, lightest in dark), so
 * clearing it clears the rest.
 *
 * When the authored foreground already fails, there is nothing to walk toward;
 * the foreground is returned untouched so the editor's warning stays truthful
 * rather than being papered over by a silent correction.
 */
function mute(
  foreground: Oklch,
  worst: Oklch,
  target: number = AA_TEXT
): Oklch {
  const softened = scaleChroma(foreground, 0.9);
  // Fitted before measuring, for the same reason `solveForContrast` does it.
  const at = (l: number) => fitToGamut({ ...softened, l });
  if (contrastRatio(at(softened.l), worst) < target) return foreground;

  let pass = softened.l;
  let fail = worst.l;
  for (let i = 0; i < 24; i++) {
    const mid = (pass + fail) / 2;
    if (contrastRatio(at(mid), worst) >= target) pass = mid;
    else fail = mid;
  }
  return at(pass);
}

/**
 * Every custom property for one palette.
 *
 * Which step table applies is read from the palette's own background rather
 * than passed in as a mode label. A label can disagree with the colours — and
 * when it did, dark-mode offsets applied to a near-white ground drove every
 * surface to pure white and quietly broke contrast. Asking the background
 * makes the function total: any palette derives correctly, and an admin who
 * authors a dark "light mode" simply gets dark-ground rules, which is right.
 *
 * `secondary` and `muted` share a level, and `popover` shares with `card`, both
 * matching `globals.css` — they exist as separate tokens because shadcn's
 * components ask for them by name, not because they are meant to differ.
 */
export function deriveTokens(
  palette: ThemePalette,
  /**
   * The backdrop this palette will be painted under.
   *
   * It changes what "readable" means. A decorative layer sits *behind* body
   * text, so it shifts the ground that text is read against — and muted text is
   * solved to land exactly on AA, which leaves it nothing in reserve. Mesh over
   * the house palette in dark mode put it at 4.42:1 while every token still
   * passed in isolation. Passing the backdrop in lets the solve account for it
   * rather than bolting a fudge factor onto every theme.
   *
   * Defaults to "none" so callers that only want the palette are unaffected.
   */
  backdrop: BackdropId = "none"
): DerivedPalette {
  const background = fitToGamut(clampOklch(palette.background));
  const ground = isLight(background) ? "light" : "dark";
  const steps = SURFACES[ground];
  const foreground = fitToGamut(clampOklch(palette.foreground));
  const primary = fitToGamut(clampOklch(palette.primary));
  const brand = fitToGamut(clampOklch(palette.brand));

  const card = surface(background, steps.card);
  const muted = surface(background, steps.muted);
  const accent = surface(background, steps.accent);
  const border = surface(background, steps.border);

  // A focus ring is a non-text UI boundary: WCAG 2.1 asks 3:1 against what
  // surrounds it. Derived from the brand so focus reads as part of the brand.
  const ring = solveForContrast(brand, background, AA_LARGE) ?? brand;

  // `backdropWorstCase` needs only background, brand and foreground — all
  // settled above — so there is no circularity in feeding it back into the
  // text solve below.
  const underBackdrop = backdropWorstCase(
    { background, brand, primary, foreground },
    backdrop
  );
  const hardestGround =
    contrastRatio(foreground, accent) <= contrastRatio(foreground, underBackdrop)
      ? accent
      : underBackdrop;

  return {
    background,
    foreground,
    card,
    "card-foreground": foreground,
    popover: card,
    "popover-foreground": foreground,
    primary,
    "primary-foreground": readableOn(primary),
    secondary: muted,
    "secondary-foreground": foreground,
    muted,
    /*
     * Solved against whichever ground gives it the least to work with.
     *
     * Two candidates, and they are different surfaces rather than degrees of
     * one. `accent` is an opaque panel painted *over* the backdrop, so the
     * decoration never shows through it. The page itself has no such cover, so
     * there the text is read against the background with the backdrop composited
     * on top at its strongest point. Whichever of those is harder sets the limit.
     */
    "muted-foreground": mute(foreground, hardestGround),
    accent,
    "accent-foreground": foreground,
    destructive: DESTRUCTIVE[ground],
    border,
    input: border,
    ring,
    brand,
    "brand-foreground": readableOn(brand),
  };
}

/**
 * A dark palette from a light one, for themes that do not author their own.
 *
 * Hue is carried across untouched — that is the entire trick. Dark modes look
 * like a different brand when they are built by desaturating to grey; keeping
 * the light theme's hues and only moving lightness and chroma keeps the two
 * recognisably the same site with the lights off.
 *
 * Primary *inverts* rather than darkens. In the live theme a solid button is
 * dark walnut on ivory and warm bone on charcoal — the fill swaps ends of the
 * scale so the button stays the loudest thing on the page in both modes. The
 * 1.19 constant is that reflection, fitted to the hand-tuned pair (0.245 →
 * 0.945) and clamped so extreme inputs stay on the scale.
 */
export function deriveDark(light: ThemePalette): ThemePalette {
  return {
    background: fitToGamut({
      l: 0.165,
      c: light.background.c * 1.6,
      h: light.background.h,
    }),
    foreground: fitToGamut({
      l: 0.955,
      c: light.foreground.c * 0.43,
      h: light.foreground.h,
    }),
    primary: fitToGamut({
      l: Math.min(0.96, Math.max(0.15, 1.19 - light.primary.l)),
      c: light.primary.c * 0.45,
      h: light.primary.h,
    }),
    // The mark glows a touch brighter with the lights off.
    brand: fitToGamut({
      l: Math.min(0.86, light.brand.l + 0.045),
      c: light.brand.c * 1.05,
      h: light.brand.h,
    }),
  };
}

/** The full computed theme. Never stored — recomputed from `ThemeInput`. */
export function deriveTheme(input: ThemeInput): DerivedTheme {
  const light = deriveTokens(input.light, input.backdrop);
  const dark = deriveTokens(input.dark ?? deriveDark(input.light), input.backdrop);
  return {
    light,
    dark,
    radius: Math.min(2, Math.max(0, input.radius)),
    fonts: {
      body: fontStack(input.fonts.body),
      display: fontStack(input.fonts.display),
    },
    // Per mode, because a backdrop is tinted from the palette it sits on.
    backdrop: {
      id: input.backdrop,
      light: backdropCss(light, input.backdrop),
      dark: backdropCss(dark, input.backdrop),
    },
    defaultMode: input.defaultMode,
    logo: input.logo,
  };
}
