/**
 * The published theme, for the public site.
 *
 * Uses the cookie-free anon client, and that is load-bearing rather than
 * incidental. This loader runs in the *root layout*, so it is on the render
 * path of every page on the site — if it touched cookies, Next would opt every
 * route into dynamic rendering and undo the work that made the marketing pages
 * CDN-cacheable. `lib/supabase/public.ts` has the longer version of that story.
 *
 * The theme is public by definition (it is visible in the rendered page), so
 * `theme_settings` carries a blanket public-read policy and nothing here needs
 * a session. Drafts and history live in `theme_versions`, which is admin-only
 * and never read from this file.
 *
 * Every failure path returns `DEFAULT_THEME` rather than throwing. A theme is
 * chrome: a site that renders in last week's colours is fine, a site that
 * 500s because a JSON blob was malformed is not.
 */

import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { themeInputSchema } from "@/lib/theme/schema";
import { DEFAULT_THEME, type ThemeInput } from "@/lib/theme/tokens";

/**
 * `cache()` dedupes within a single render pass. The root layout needs the
 * theme for both the injected stylesheet and the provider's default mode, and
 * without this that would be two round trips per request on dynamic routes.
 */
export const getPublishedTheme = cache(async (): Promise<ThemeInput> => {
  if (!isSupabaseConfigured()) return DEFAULT_THEME;

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("theme_settings")
    .select("tokens")
    .eq("id", true)
    .maybeSingle();

  if (error || !data) return DEFAULT_THEME;

  const parsed = themeInputSchema.safeParse(data.tokens);
  if (!parsed.success) {
    // Worth shouting about: the site is now silently not wearing the theme
    // the admin published, and only the server log will say so.
    console.error("[theme] stored blob failed validation", parsed.error.issues);
    return DEFAULT_THEME;
  }

  return parsed.data;
});
