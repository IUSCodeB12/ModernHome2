import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { getActiveServices } from "@/lib/services/data";
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

export type HeroSlide = Pick<Tables<"hero_slides">, "id" | "image_url" | "headline">;

export type ShowcasePanel = Pick<
  Tables<"service_showcase">,
  "id" | "image_url" | "eyebrow" | "title" | "body" | "price_hint"
> & { slug: string | null };

/** Copy-only fallback so the section still sells when Supabase is unconfigured. */
const DEMO_SHOWCASE: ShowcasePanel[] = [
  {
    id: "s1",
    image_url: null,
    eyebrow: "TV Wall Mounting",
    title: "Any TV, any wall",
    body: "Plasterboard, brick or concrete — mounted level, cables concealed, power sorted.",
    price_hint: "from $149",
    slug: "tv-wall-mounting",
  },
  {
    id: "s2",
    image_url: null,
    eyebrow: "Floating Cabinet",
    title: "Floating cabinets with LED glow",
    body: "Made to measure, wall-mounted with a seamless look and warm underglow lighting.",
    price_hint: "from $450 / m",
    slug: "tv-floating-cabinet",
  },
  {
    id: "s3",
    image_url: null,
    eyebrow: "LED Strip Lighting",
    title: "Light that sets the mood",
    body: "Kickboards, ceiling coves, cabinets — supplied, installed and dimmable.",
    price_hint: "from $85 / m",
    slug: "led-strip-lighting",
  },
];

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
  heroSlides: HeroSlide[];
  showcase: ShowcasePanel[];
};

export async function getHomeData(): Promise<HomeData> {
  const services = await getActiveServices();

  if (!isSupabaseConfigured()) {
    return {
      services,
      featured: DEMO_FEATURED,
      recent: DEMO_RECENT,
      heroSlides: [],
      showcase: DEMO_SHOWCASE,
    };
  }

  const supabase = await createClient();
  const [galleryRes, jobsRes, heroRes, showcaseRes] = await Promise.all([
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
    supabase
      .from("hero_slides")
      .select("id, image_url, headline")
      .eq("active", true)
      .order("sort_order"),
    supabase
      .from("service_showcase")
      .select("id, image_url, eyebrow, title, body, price_hint, services(slug)")
      .eq("active", true)
      .order("sort_order"),
  ]);

  const featured = galleryRes.data?.length ? galleryRes.data : DEMO_FEATURED;

  const recent: RecentJob[] =
    jobsRes.data?.map((b) => ({
      id: b.id,
      service: b.quote_requests?.services?.name ?? "Installation",
      suburb: b.suburb ?? "Melbourne",
      when: "recently",
    })) ?? [];

  const showcase: ShowcasePanel[] =
    showcaseRes.data?.map((p) => ({
      id: p.id,
      image_url: p.image_url,
      eyebrow: p.eyebrow,
      title: p.title,
      body: p.body,
      price_hint: p.price_hint,
      slug: p.services?.slug ?? null,
    })) ?? [];

  return {
    services,
    featured,
    recent: recent.length ? recent : DEMO_RECENT,
    heroSlides: heroRes.data ?? [],
    showcase,
  };
}
