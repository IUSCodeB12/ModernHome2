"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminAction, type ActionResult } from "@/lib/admin/guard";
import { isSupabaseConfigured } from "@/lib/supabase/admin";

const addSchema = z.object({
  imageUrl: z.string().url(),
  headline: z.string().trim().max(120).optional(),
});

function revalidate() {
  revalidatePath("/admin/hero");
  revalidatePath("/", "layout");
}

/** Add a slide (image already uploaded to the gallery bucket client-side). */
export async function addHeroSlide(
  input: z.input<typeof addSchema>
): Promise<ActionResult> {
  const parsed = addSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid image." };
  if (!isSupabaseConfigured()) return { ok: true };

  return adminAction(async ({ admin }) => {
    const { data: max } = await admin
      .from("hero_slides")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { error } = await admin.from("hero_slides").insert({
      image_url: parsed.data.imageUrl,
      headline: parsed.data.headline || null,
      sort_order: (max?.sort_order ?? 0) + 1,
    });
    if (error) throw new Error(error.message);
    revalidate();
    return;
  });
}

export async function deleteHeroSlide(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: true };
  return adminAction(async ({ admin }) => {
    const { error } = await admin.from("hero_slides").delete().eq("id", id);
    if (error) throw new Error(error.message);
    revalidate();
    return;
  });
}

export async function toggleHeroSlide(id: string, active: boolean): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: true };
  return adminAction(async ({ admin }) => {
    const { error } = await admin.from("hero_slides").update({ active }).eq("id", id);
    if (error) throw new Error(error.message);
    revalidate();
    return;
  });
}

/** Persist a new display order (array of slide ids, top → bottom). */
export async function reorderHeroSlides(orderedIds: string[]): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: true };
  return adminAction(async ({ admin }) => {
    await Promise.all(
      orderedIds.map((id, i) =>
        admin.from("hero_slides").update({ sort_order: i }).eq("id", id)
      )
    );
    revalidate();
    return;
  });
}
