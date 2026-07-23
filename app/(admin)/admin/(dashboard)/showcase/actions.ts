"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminAction, type ActionResult } from "@/lib/admin/guard";
import { isSupabaseConfigured } from "@/lib/supabase/admin";

const panelSchema = z.object({
  id: z.string().uuid(),
  serviceId: z.string().uuid().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  eyebrow: z.string().trim().max(60).nullable().optional(),
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().max(400).nullable().optional(),
  priceHint: z.string().trim().max(40).nullable().optional(),
});

function revalidate() {
  revalidatePath("/admin/showcase");
  revalidatePath("/", "layout");
}

/** Save a panel's copy, photo and linked service. */
export async function updateShowcasePanel(
  input: z.input<typeof panelSchema>
): Promise<ActionResult> {
  const parsed = panelSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the panel fields." };
  if (!isSupabaseConfigured()) return { ok: true };

  const p = parsed.data;
  return adminAction(async ({ admin }) => {
    const { error } = await admin
      .from("service_showcase")
      .update({
        service_id: p.serviceId ?? null,
        image_url: p.imageUrl ?? null,
        eyebrow: p.eyebrow || null,
        title: p.title,
        body: p.body || null,
        price_hint: p.priceHint || null,
      })
      .eq("id", p.id);
    if (error) throw new Error(error.message);
    revalidate();
    return;
  });
}

export async function addShowcasePanel(): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: true };
  return adminAction(async ({ admin }) => {
    const { data: max } = await admin
      .from("service_showcase")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { error } = await admin.from("service_showcase").insert({
      title: "New panel",
      sort_order: (max?.sort_order ?? 0) + 1,
    });
    if (error) throw new Error(error.message);
    revalidate();
    return;
  });
}

export async function deleteShowcasePanel(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: true };
  return adminAction(async ({ admin }) => {
    const { error } = await admin.from("service_showcase").delete().eq("id", id);
    if (error) throw new Error(error.message);
    revalidate();
    return;
  });
}

export async function toggleShowcasePanel(
  id: string,
  active: boolean
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: true };
  return adminAction(async ({ admin }) => {
    const { error } = await admin
      .from("service_showcase")
      .update({ active })
      .eq("id", id);
    if (error) throw new Error(error.message);
    revalidate();
    return;
  });
}

/** Persist a new display order (array of panel ids, top → bottom). */
export async function reorderShowcasePanels(
  orderedIds: string[]
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: true };
  return adminAction(async ({ admin }) => {
    await Promise.all(
      orderedIds.map((id, i) =>
        admin.from("service_showcase").update({ sort_order: i }).eq("id", id)
      )
    );
    revalidate();
    return;
  });
}
