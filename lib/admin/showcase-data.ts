import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import type { Tables } from "@/lib/database.types";

export type ShowcaseRow = Pick<
  Tables<"service_showcase">,
  | "id"
  | "service_id"
  | "image_url"
  | "eyebrow"
  | "title"
  | "body"
  | "price_hint"
  | "sort_order"
  | "active"
>;

export type ShowcaseServiceOption = { id: string; name: string };

export async function getShowcaseAdmin(): Promise<{
  panels: ShowcaseRow[];
  services: ShowcaseServiceOption[];
  demo: boolean;
}> {
  if (!isSupabaseConfigured()) {
    return { panels: [], services: [], demo: true };
  }
  const supabase = await createClient();
  const [panelsRes, servicesRes] = await Promise.all([
    supabase
      .from("service_showcase")
      .select(
        "id, service_id, image_url, eyebrow, title, body, price_hint, sort_order, active"
      )
      .order("sort_order"),
    supabase.from("services").select("id, name").order("name"),
  ]);
  return {
    panels: panelsRes.data ?? [],
    services: servicesRes.data ?? [],
    demo: false,
  };
}
