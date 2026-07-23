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

/**
 * Showcase photo per service, keyed by service id. Reuses the homepage
 * showcase panels so the tradie curates job photography in one place
 * (/admin/showcase) and it appears on the services index too. Services
 * without a panel — or with a panel that has no photo yet — are simply absent.
 */
export async function getServicePhotos(): Promise<Record<string, string>> {
  if (!isSupabaseConfigured()) return {};
  const supabase = await createClient();
  const { data } = await supabase
    .from("service_showcase")
    .select("service_id, image_url")
    .eq("active", true)
    .order("sort_order");

  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    if (row.service_id && row.image_url && !map[row.service_id]) {
      map[row.service_id] = row.image_url;
    }
  }
  return map;
}
