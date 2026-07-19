"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminAction, type ActionResult } from "@/lib/admin/guard";
import { isSupabaseConfigured } from "@/lib/supabase/admin";

const ruleSchema = z.object({
  day_of_week: z.coerce.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
});

const blockSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().max(200).optional().default(""),
});

const idSchema = z.object({ id: z.string().min(1) });

export async function addAvailabilityRule(
  input: z.input<typeof ruleSchema>
): Promise<ActionResult<object>> {
  const parsed = ruleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid rule." };
  if (parsed.data.end_time <= parsed.data.start_time) {
    return { ok: false, error: "End time must be after start time." };
  }
  if (!isSupabaseConfigured()) return { ok: true, data: {} } as ActionResult<object>;

  return adminAction(async ({ admin }) => {
    const { error } = await admin.from("availability_rules").insert({
      day_of_week: parsed.data.day_of_week,
      start_time: parsed.data.start_time,
      end_time: parsed.data.end_time,
      active: true,
    });
    if (error) throw new Error(error.message);
    revalidatePath("/admin/calendar");
    return {};
  });
}

export async function deleteAvailabilityRule(
  input: z.input<typeof idSchema>
): Promise<ActionResult<object>> {
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  if (!isSupabaseConfigured()) return { ok: true, data: {} } as ActionResult<object>;

  return adminAction(async ({ admin }) => {
    const { error } = await admin.from("availability_rules").delete().eq("id", parsed.data.id);
    if (error) throw new Error(error.message);
    revalidatePath("/admin/calendar");
    return {};
  });
}

export async function blockDate(
  input: z.input<typeof blockSchema>
): Promise<ActionResult<object>> {
  const parsed = blockSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid date." };
  if (!isSupabaseConfigured()) return { ok: true, data: {} } as ActionResult<object>;

  return adminAction(async ({ admin }) => {
    const { error } = await admin
      .from("blocked_dates")
      .upsert({ date: parsed.data.date, reason: parsed.data.reason || null }, { onConflict: "date" });
    if (error) throw new Error(error.message);
    revalidatePath("/admin/calendar");
    return {};
  });
}

export async function unblockDate(
  input: z.input<typeof idSchema>
): Promise<ActionResult<object>> {
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  if (!isSupabaseConfigured()) return { ok: true, data: {} } as ActionResult<object>;

  return adminAction(async ({ admin }) => {
    const { error } = await admin.from("blocked_dates").delete().eq("id", parsed.data.id);
    if (error) throw new Error(error.message);
    revalidatePath("/admin/calendar");
    return {};
  });
}
