"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminAction, type ActionResult } from "@/lib/admin/guard";
import { isSupabaseConfigured } from "@/lib/supabase/admin";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  service_id: z.string().uuid().nullable().optional(),
  before_image_url: z.string().min(1),
  after_image_url: z.string().min(1).nullable().optional(),
});

const idSchema = z.object({ id: z.string().min(1) });
const featuredSchema = z.object({ id: z.string().min(1), featured: z.boolean() });
const reorderSchema = z.object({ orderedIds: z.array(z.string().min(1)) });

export async function createGalleryItem(
  input: z.input<typeof createSchema>
): Promise<ActionResult<object>> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid gallery item." };
  if (!isSupabaseConfigured()) return { ok: true, data: {} } as ActionResult<object>;

  return adminAction(async ({ admin }) => {
    const { count } = await admin
      .from("gallery_items")
      .select("id", { count: "exact", head: true });
    const { error } = await admin.from("gallery_items").insert({
      title: parsed.data.title,
      service_id: parsed.data.service_id ?? null,
      before_image_url: parsed.data.before_image_url,
      after_image_url: parsed.data.after_image_url ?? null,
      sort_order: count ?? 0,
    });
    if (error) throw new Error(error.message);
    revalidatePath("/admin/gallery");
    revalidatePath("/gallery");
    return {};
  });
}

export async function toggleFeatured(
  input: z.input<typeof featuredSchema>
): Promise<ActionResult<object>> {
  const parsed = featuredSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  if (!isSupabaseConfigured()) return { ok: true, data: {} } as ActionResult<object>;

  return adminAction(async ({ admin }) => {
    const { error } = await admin
      .from("gallery_items")
      .update({ featured: parsed.data.featured })
      .eq("id", parsed.data.id);
    if (error) throw new Error(error.message);
    revalidatePath("/admin/gallery");
    revalidatePath("/gallery");
    return {};
  });
}

export async function deleteGalleryItem(
  input: z.input<typeof idSchema>
): Promise<ActionResult<object>> {
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  if (!isSupabaseConfigured()) return { ok: true, data: {} } as ActionResult<object>;

  return adminAction(async ({ admin }) => {
    const { error } = await admin.from("gallery_items").delete().eq("id", parsed.data.id);
    if (error) throw new Error(error.message);
    revalidatePath("/admin/gallery");
    revalidatePath("/gallery");
    return {};
  });
}

export async function reorderGallery(
  input: z.input<typeof reorderSchema>
): Promise<ActionResult<object>> {
  const parsed = reorderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid order." };
  if (!isSupabaseConfigured()) return { ok: true, data: {} } as ActionResult<object>;

  return adminAction(async ({ admin }) => {
    await Promise.all(
      parsed.data.orderedIds.map((id, index) =>
        admin.from("gallery_items").update({ sort_order: index }).eq("id", id)
      )
    );
    revalidatePath("/admin/gallery");
    revalidatePath("/gallery");
    return {};
  });
}
