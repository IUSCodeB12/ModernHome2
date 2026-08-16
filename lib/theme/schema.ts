/**
 * Runtime validation for a stored theme blob.
 *
 * Two callers, for two different reasons. The publish action validates admin
 * input before it is written — the usual reason. The public loader validates
 * again on the way *out*, which matters more: that blob is about to be turned
 * into CSS and inlined into every page of the site, so it is the last point at
 * which a row that was hand-edited in the Supabase dashboard, restored from an
 * old backup, or written by a future schema version can be caught before it
 * reaches a visitor. A blob that fails here falls back to `DEFAULT_THEME`
 * rather than rendering a broken site.
 *
 * Note what is *not* here: any check on colour strings. Colours are stored as
 * three bounded numbers, so validation is a range check rather than a parser,
 * and `formatOklch` can only ever emit digits. There is no sanitiser to get
 * wrong because there is no place for a string to enter the stylesheet.
 */

import { z } from "zod";
import { BACKDROP_IDS } from "@/lib/theme/backdrops";
import { FONTS, type FontId } from "@/lib/theme/fonts";

const FONT_ID_VALUES = Object.keys(FONTS) as [FontId, ...FontId[]];

const oklchSchema = z.object({
  l: z.number().min(0).max(1),
  c: z.number().min(0).max(0.4),
  h: z.number().min(0).max(360),
});

const paletteSchema = z.object({
  background: oklchSchema,
  foreground: oklchSchema,
  primary: oklchSchema,
  brand: oklchSchema,
});

/**
 * Brand asset URLs are pinned to our own public storage.
 *
 * The logo is rendered by `next/image` and printed in the site header on every
 * page. Without this an admin — or anything that could write the row — could
 * point it at a third-party host, which would leak every visitor's IP and
 * referrer to that host and hand it control of what the brand mark shows.
 * `next.config.ts` already limits `remotePatterns` to `*.supabase.co`; this
 * narrows it further to the public `gallery` bucket's `brand/` prefix, so the
 * only accepted values are files uploaded through the admin UI.
 */
const brandAssetSchema = z
  .string()
  .url()
  .refine((value) => {
    try {
      const url = new URL(value);
      return (
        url.protocol === "https:" &&
        url.hostname.endsWith(".supabase.co") &&
        url.pathname.startsWith("/storage/v1/object/public/gallery/brand/")
      );
    } catch {
      return false;
    }
  }, "Logo must be an uploaded file in the brand folder")
  .nullable();

export const themeInputSchema = z.object({
  schemaVersion: z.number().int().positive(),
  light: paletteSchema,
  dark: paletteSchema.nullable(),
  radius: z.number().min(0).max(2),
  fonts: z.object({
    body: z.enum(FONT_ID_VALUES),
    display: z.enum(FONT_ID_VALUES),
  }),
  // Defaulted rather than required: themes written before backdrops existed
  // are still valid and simply get the house one.
  backdrop: z.enum(BACKDROP_IDS).default("aurora"),
  defaultMode: z.enum(["light", "dark", "system"]),
  logo: z.object({ light: brandAssetSchema, dark: brandAssetSchema }),
});

export type ThemeInputParsed = z.infer<typeof themeInputSchema>;
