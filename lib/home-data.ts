import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { getActiveServices } from "@/lib/services-data";
import type { ServiceWithQuestions } from "@/lib/quote/types";
import type { Tables } from "@/lib/database.types";

export type FeaturedItem = Pick<
  Tables<"gallery_items">,
  "id" | "title" | "before_image_url" | "after_image_url"
>;

export type RecentJob = {
  id: string;
  service: string;
  suburb: string;
  when: string;
};

const DEMO_FEATURED: FeaturedItem[] = [
  { id: "d1", title: "65\" TV + floating cabinet", before_image_url: "", after_image_url: "" },
  { id: "d2", title: "Kitchen kickboard LED", before_image_url: "", after_image_url: "" },
  { id: "d3", title: "Showcase cabinet build", before_image_url: "", after_image_url: "" },
];

const DEMO_RECENT: RecentJob[] = [
  { id: "r1", service: "TV Wall Mounting", suburb: "Richmond", when: "Tuesday" },
  { id: "r2", service: "LED Strip Lighting", suburb: "Carlton", when: "last week" },
  { id: "r3", service: "Floating Cabinet", suburb: "Fitzroy", when: "3 days ago" },
  { id: "r4", service: "Room Heater", suburb: "Brunswick", when: "Monday" },
  { id: "r5", service: "Showcase Cabinet", suburb: "Hawthorn", when: "last week" },
];

export type HomeData = {
  services: ServiceWithQuestions[];
  featured: FeaturedItem[];
  recent: RecentJob[];
};

export async function getHomeData(): Promise<HomeData> {
  const services = await getActiveServices();

  if (!isSupabaseConfigured()) {
    return { services, featured: DEMO_FEATURED, recent: DEMO_RECENT };
  }

  const supabase = await createClient();
  const [galleryRes, jobsRes] = await Promise.all([
    supabase
      .from("gallery_items")
      .select("id, title, before_image_url, after_image_url")
      .order("featured", { ascending: false })
      .order("sort_order")
      .limit(4),
    supabase
      .from("bookings")
      .select("id, suburb, updated_at, status, quote_requests(services(name))")
      .in("status", ["completed", "invoiced", "paid"])
      .order("updated_at", { ascending: false })
      .limit(6),
  ]);

  const featured = galleryRes.data?.length ? galleryRes.data : DEMO_FEATURED;

  const recent: RecentJob[] =
    jobsRes.data?.map((b) => ({
      id: b.id,
      service: b.quote_requests?.services?.name ?? "Installation",
      suburb: b.suburb ?? "Melbourne",
      when: "recently",
    })) ?? [];

  return {
    services,
    featured,
    recent: recent.length ? recent : DEMO_RECENT,
  };
}
