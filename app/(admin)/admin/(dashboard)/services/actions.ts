"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminAction, type ActionResult } from "@/lib/admin/guard";
import { isSupabaseConfigured } from "@/lib/supabase/admin";

const serviceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2).max(120),
  description: z.string().max(2000).optional().default(""),
  base_price_cents: z.coerce.number().int().min(0).max(100_000_000),
  price_unit: z.enum(["fixed", "per_metre", "per_hour"]),
  active: z.boolean(),
  sort_order: z.coerce.number().int().min(0).max(1000),
  ar_model_glb_url: z.string().max(1000).nullable().optional(),
  ar_model_usdz_url: z.string().max(1000).nullable().optional(),
});

const optionSchema = z.object({
  label: z.string().min(1).max(120),
  value: z.string().min(1).max(120),
  price_modifier_cents: z.coerce.number().int().min(-100_000_000).max(100_000_000).nullable(),
  price_modifier_pct: z.coerce.number().min(-100).max(1000).nullable(),
});

const questionSchema = z.object({
  id: z.string().min(1),
  question_text: z.string().min(2).max(300),
  options: z.array(optionSchema),
});

export async function updateService(
  input: z.input<typeof serviceSchema>
): Promise<ActionResult<object>> {
  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid service." };
  }
  if (!isSupabaseConfigured()) return { ok: true, data: {} } as ActionResult<object>;

  return adminAction(async ({ admin }) => {
    const { id, description, ar_model_glb_url, ar_model_usdz_url, ...rest } = parsed.data;
    const { error } = await admin
      .from("services")
      .update({
        ...rest,
        description: description || null,
        ar_model_glb_url: ar_model_glb_url || null,
        ar_model_usdz_url: ar_model_usdz_url || null,
      })
      .eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/admin/services");
    revalidatePath("/quote");
    revalidatePath("/services");
    return {};
  });
}

/** Update a question's text and its pricing options/modifiers. */
export async function updateQuestion(
  input: z.input<typeof questionSchema>
): Promise<ActionResult<object>> {
  const parsed = questionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid question." };
  }
  if (!isSupabaseConfigured()) return { ok: true, data: {} } as ActionResult<object>;

  return adminAction(async ({ admin }) => {
    const { error } = await admin
      .from("service_questions")
      .update({
        question_text: parsed.data.question_text,
        options: parsed.data.options,
      })
      .eq("id", parsed.data.id);
    if (error) throw new Error(error.message);
    revalidatePath("/admin/services");
    revalidatePath("/quote");
    return {};
  });
}
