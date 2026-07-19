import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { getDemoWizardData } from "@/lib/quote/demo-data";
import type { ServiceWithQuestions } from "@/lib/quote/types";

export async function getActiveServices(): Promise<ServiceWithQuestions[]> {
  if (!isSupabaseConfigured()) return getDemoWizardData().services;
  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select("*, service_questions(*)")
    .eq("active", true)
    .order("sort_order");
  return (data ?? []).map((s) => ({
    ...s,
    service_questions: [...s.service_questions].sort(
      (a, b) => a.sort_order - b.sort_order
    ),
  }));
}

export async function getServiceBySlug(
  slug: string
): Promise<ServiceWithQuestions | null> {
  if (!isSupabaseConfigured()) {
    return getDemoWizardData().services.find((s) => s.slug === slug) ?? null;
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select("*, service_questions(*)")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();
  if (!data) return null;
  return {
    ...data,
    service_questions: [...data.service_questions].sort(
      (a, b) => a.sort_order - b.sort_order
    ),
  };
}
