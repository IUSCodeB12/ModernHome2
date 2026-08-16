/**
 * The font safe list.
 *
 * Not free text, and it cannot be: `next/font/google` resolves families at
 * *build* time from static literals, so a family name coming out of the
 * database can never be fetched. Every face offered here is therefore compiled
 * into `app/layout.tsx` and referenced by its CSS variable.
 *
 * Adding a face is a two-step change — an entry here plus a `next/font`
 * declaration in the root layout — and that friction is the point. It is also
 * why the database stores an id from this table rather than a font name: an
 * unknown id degrades to the fallback stack instead of emitting an
 * unresolvable family, and there is no path by which admin input becomes part
 * of a `font-family` declaration.
 */

type FontEntry = {
  label: string;
  /** Shown under the label in the picker. */
  note: string;
  /** Declared by `next/font` in the root layout. */
  variable: string;
  fallback: string;
  category: "sans" | "serif";
};

export const FONTS = {
  geist: {
    label: "Geist",
    note: "Clean neutral sans — the house default",
    variable: "--font-geist-sans",
    fallback: "ui-sans-serif, system-ui, sans-serif",
    category: "sans",
  },
  inter: {
    label: "Inter",
    note: "Highly legible sans, tuned for screens",
    variable: "--font-inter",
    fallback: "ui-sans-serif, system-ui, sans-serif",
    category: "sans",
  },
  fraunces: {
    label: "Fraunces",
    note: "Editorial serif with optical sizing",
    variable: "--font-fraunces",
    fallback: "Georgia, serif",
    category: "serif",
  },
  "instrument-serif": {
    label: "Instrument Serif",
    note: "High-contrast display serif",
    variable: "--font-instrument-serif",
    fallback: "Georgia, serif",
    category: "serif",
  },
} as const satisfies Record<string, FontEntry>;

export type FontId = keyof typeof FONTS;

export const FONT_IDS = Object.keys(FONTS) as FontId[];

/** Body copy stays sans — a serif body on a trade site reads as a blog. */
export const BODY_FONT_IDS = FONT_IDS.filter(
  (id) => FONTS[id].category === "sans"
);

/** Headlines may be either; the display face is where the personality lives. */
export const DISPLAY_FONT_IDS = FONT_IDS;

/**
 * `var(--font-x), Fallback, sans-serif` — safe to interpolate into CSS because
 * every part comes from the table above, never from stored data.
 */
export function fontStack(id: FontId): string {
  const font = FONTS[id] ?? FONTS.geist;
  return `var(${font.variable}), ${font.fallback}`;
}
