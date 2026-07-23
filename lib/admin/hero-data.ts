import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import type { Tables } from "@/lib/database.types";

export type HeroSlideRow = Pick<
  Tables<"hero_slides">,
  "id" | "image_url" | "headline" | "sort_order" | "active"
>;

export async function getHeroSlidesAdmin(): Promise<{
  slides: HeroSlideRow[];
  demo: boolean;
}> {
  if (!isSupabaseConfigured()) {
    return { slides: [], demo: true };
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("hero_slides")
    .select("id, image_url, headline, sort_order, active")
    .order("sort_order");
  return { slides: data ?? [], demo: false };
}
