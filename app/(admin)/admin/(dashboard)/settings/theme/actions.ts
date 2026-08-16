"use server";

import { revalidatePath } from "next/cache";
import { adminAction, type ActionResult } from "@/lib/admin/guard";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { AA_TEXT, contrastRatio } from "@/lib/theme/contrast";
import { deriveTheme } from "@/lib/theme/derive";
import { themeInputSchema } from "@/lib/theme/schema";
import { DEFAULT_THEME, type ThemeInput } from "@/lib/theme/tokens";

/**
 * Everything the public site renders lives under the root layout, so a publish
 * has to drop the whole tree — not just this page. Same call the hero and
 * showcase editors make; without it the marketing pages keep serving their
 * cached HTML, theme block and all, for up to an hour.
 */
function revalidateSite() {
  revalidatePath("/admin/settings/theme");
  revalidatePath("/", "layout");
}

/**
 * The one contrast pair the system cannot fix on the admin's behalf.
 *
 * Everything derived is *solved* for AA (see `derive.ts`), but the admin picks
 * foreground and background directly, and correcting those silently would mean
 * publishing colours they did not choose. So it is checked here instead, and it
 * blocks.
 *
 * Measured against `accent`, not `background`. Accent is the furthest surface
 * from the page ground, so body text sits on it at the lowest ratio anywhere on
 * the site — checking the ground alone passes text that then fails on every
 * muted panel. That is the exact gap that put `muted-foreground` at 4.17:1
 * during step 1; this is the same bug's other half.
 */
function contrastFailure(tokens: ThemeInput): string | null {
  const theme = deriveTheme(tokens);
  for (const mode of ["light", "dark"] as const) {
    const palette = theme[mode];
    const ratio = contrastRatio(palette.foreground, palette.accent);
    if (ratio < AA_TEXT) {
      return `Text on muted panels is ${ratio.toFixed(2)}:1 in ${mode} mode — WCAG AA needs ${AA_TEXT}:1. Adjust the text or background colour, or use the suggested fix.`;
    }
  }
  return null;
}

/** Saves work in progress. Deliberately does *not* enforce contrast. */
export async function saveThemeDraft(input: unknown): Promise<ActionResult> {
  const parsed = themeInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "That theme isn't valid." };
  if (!isSupabaseConfigured()) return { ok: true };

  return adminAction(async ({ admin, user }) => {
    // The partial unique index allows exactly one draft, so this is an upsert
    // by hand: clear then insert, rather than racing two rival drafts.
    await admin.from("theme_versions").delete().eq("status", "draft");
    const { error } = await admin.from("theme_versions").insert({
      status: "draft",
      tokens: parsed.data,
      created_by: user.id,
    });
    if (error) throw new Error(error.message);
    revalidatePath("/admin/settings/theme");
  });
}

export async function discardThemeDraft(): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: true };
  return adminAction(async ({ admin }) => {
    const { error } = await admin
      .from("theme_versions")
      .delete()
      .eq("status", "draft");
    if (error) throw new Error(error.message);
    revalidatePath("/admin/settings/theme");
  });
}

/**
 * Makes a theme live.
 *
 * The history row is written *first*. If the settings update then fails, the
 * worst case is an audit entry for a publish that did not land — noise. The
 * other order risks a live theme with no record of who put it there, which is
 * the one outcome an audit trail exists to prevent.
 */
export async function publishTheme(
  input: unknown,
  note?: string
): Promise<ActionResult> {
  const parsed = themeInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "That theme isn't valid." };

  const failure = contrastFailure(parsed.data);
  if (failure) return { ok: false, error: failure };

  if (!isSupabaseConfigured()) return { ok: true };

  return adminAction(async ({ admin, user }) => {
    const { data: current } = await admin
      .from("theme_settings")
      .select("version")
      .eq("id", true)
      .maybeSingle();
    const version = (current?.version ?? 0) + 1;

    const { error: historyError } = await admin.from("theme_versions").insert({
      status: "published",
      tokens: parsed.data,
      version,
      created_by: user.id,
      note: note?.trim() || null,
    });
    if (historyError) throw new Error(historyError.message);

    const { error } = await admin
      .from("theme_settings")
      .upsert({ id: true, tokens: parsed.data, version });
    if (error) throw new Error(error.message);

    await admin.from("theme_versions").delete().eq("status", "draft");
    revalidateSite();
  });
}

/**
 * Restores a previous publish as the working draft rather than making it live.
 *
 * Rolling straight to live would be one click between "let me look at the old
 * one" and a changed public site. This way the admin lands in the editor with
 * it loaded and still has to press Publish.
 */
export async function rollbackTheme(versionId: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: true };

  return adminAction(async ({ admin, user }) => {
    const { data: version } = await admin
      .from("theme_versions")
      .select("tokens")
      .eq("id", versionId)
      .eq("status", "published")
      .maybeSingle();
    if (!version) throw new Error("That version no longer exists.");

    const parsed = themeInputSchema.safeParse(version.tokens);
    if (!parsed.success) throw new Error("That version can no longer be read.");

    await admin.from("theme_versions").delete().eq("status", "draft");
    const { error } = await admin.from("theme_versions").insert({
      status: "draft",
      tokens: parsed.data,
      created_by: user.id,
    });
    if (error) throw new Error(error.message);
    revalidatePath("/admin/settings/theme");
  });
}

/** Loads the locked house theme as a draft. Same reasoning as rollback. */
export async function resetThemeToDefault(): Promise<ActionResult> {
  return saveThemeDraft(DEFAULT_THEME);
}
