import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import type { Tables } from "@/lib/database.types";

export type GalleryItem = Pick<
  Tables<"gallery_items">,
  "id" | "title" | "before_image_url" | "after_image_url" | "featured" | "service_id"
> & {
  services: Pick<Tables<"services">, "name" | "slug"> | null;
};

export type GalleryFilter = { slug: string; name: string };

const DEMO_ITEMS: GalleryItem[] = [
  {
    id: "g1", title: "65\" TV + floating cabinet, Richmond",
    before_image_url: "", after_image_url: "", featured: true, service_id: null,
    services: { name: "TV Wall Mounting", slug: "tv-wall-mounting" },
  },
  {
    id: "g2", title: "Kitchen kickboard LED, Carlton",
    before_image_url: "", after_image_url: "", featured: true, service_id: null,
    services: { name: "LED Strip Lighting", slug: "led-strip-lighting" },
  },
  {
    id: "g3", title: "Showcase cabinet build, Hawthorn",
    before_image_url: "", after_image_url: "", featured: false, service_id: null,
    services: { name: "Showcase Cabinet", slug: "showcase-cabinet" },
  },
  {
    id: "g4", title: "Floating cabinet with LED glow, Fitzroy",
    before_image_url: "", after_image_url: "", featured: false, service_id: null,
    services: { name: "TV / Floating Cabinet", slug: "tv-floating-cabinet" },
  },
  {
    id: "g5", title: "Panel heater install, Brunswick",
    before_image_url: "", after_image_url: null, featured: false, service_id: null,
    services: { name: "Room Heater Installation", slug: "room-heater-installation" },
  },
  {
    id: "g6", title: "Ceiling cove lighting, Toorak",
    before_image_url: "", after_image_url: "", featured: false, service_id: null,
    services: { name: "LED Strip Lighting", slug: "led-strip-lighting" },
  },
];

export async function getGalleryItems(): Promise<{
  items: GalleryItem[];
  filters: GalleryFilter[];
  demo: boolean;
}> {
  if (!isSupabaseConfigured()) {
    return { items: DEMO_ITEMS, filters: dedupeFilters(DEMO_ITEMS), demo: true };
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("gallery_items")
    .select("id, title, before_image_url, after_image_url, featured, service_id, services(name, slug)")
    .order("featured", { ascending: false })
    .order("sort_order");

  const items = (data ?? []) as unknown as GalleryItem[];
  return { items, filters: dedupeFilters(items), demo: false };
}

function dedupeFilters(items: GalleryItem[]): GalleryFilter[] {
  const map = new Map<string, string>();
  for (const item of items) {
    if (item.services?.slug) map.set(item.services.slug, item.services.name);
  }
  return [...map.entries()].map(([slug, name]) => ({ slug, name }));
}
