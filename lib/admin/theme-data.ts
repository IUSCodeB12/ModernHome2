/**
 * Theme editor data — draft, published, and the publish history.
 *
 * Separate from `lib/theme/data.ts` on purpose. That one is the *public* read:
 * cookie-free, published-only, and on the render path of every page. This one
 * reads `theme_versions`, which is admin-only, and is therefore never allowed
 * anywhere near a cacheable route.
 */

import { assertAdmin } from "@/lib/admin/guard";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { themeInputSchema } from "@/lib/theme/schema";
import { DEFAULT_THEME, type ThemeInput } from "@/lib/theme/tokens";

export type ThemeHistoryEntry = {
  id: string;
  version: number | null;
  createdAt: string;
  /** Name of whoever published it, when the account still exists and has one. */
  publishedBy: string | null;
  note: string | null;
};

export type ThemeEditorData = {
  published: ThemeInput;
  publishedVersion: number;
  /** Null when there is no unpublished work. */
  draft: ThemeInput | null;
  history: ThemeHistoryEntry[];
  configured: boolean;
};

/** Falls back rather than throwing — a bad blob must not break the editor. */
function parse(tokens: unknown, fallback: ThemeInput | null): ThemeInput | null {
  const parsed = themeInputSchema.safeParse(tokens);
  return parsed.success ? parsed.data : fallback;
}

export async function getThemeEditorData(): Promise<ThemeEditorData> {
  if (!isSupabaseConfigured()) {
    return {
      published: DEFAULT_THEME,
      publishedVersion: 1,
      draft: null,
      history: [],
      configured: false,
    };
  }

  const { admin } = await assertAdmin();

  const [settings, draftRow, historyRows] = await Promise.all([
    admin.from("theme_settings").select("tokens, version").eq("id", true).maybeSingle(),
    admin.from("theme_versions").select("tokens").eq("status", "draft").maybeSingle(),
    admin
      .from("theme_versions")
      .select("id, version, created_at, created_by, note")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  /*
   * `created_by` points at auth.users, which PostgREST cannot traverse from
   * here, so names come from `profiles` in one lookup for the whole page rather
   * than N joins. Skipped entirely while the history is empty, which it is
   * until the first publish.
   */
  const publisherIds = [
    ...new Set((historyRows.data ?? []).map((r) => r.created_by).filter(Boolean)),
  ] as string[];
  const names = new Map<string, string>();
  if (publisherIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, full_name")
      .in("id", publisherIds);
    for (const profile of profiles ?? []) {
      if (profile.full_name) names.set(profile.id, profile.full_name);
    }
  }

  return {
    published: parse(settings.data?.tokens, DEFAULT_THEME) ?? DEFAULT_THEME,
    publishedVersion: settings.data?.version ?? 1,
    // A draft that fails validation is treated as absent: better to show the
    // admin a clean published theme than a half-parsed one they might publish.
    draft: parse(draftRow.data?.tokens, null),
    history: (historyRows.data ?? []).map((row) => ({
      id: row.id,
      version: row.version,
      createdAt: row.created_at,
      publishedBy: row.created_by ? (names.get(row.created_by) ?? null) : null,
      note: row.note,
    })),
    configured: true,
  };
}
