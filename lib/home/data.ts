import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { getActiveServices } from "@/lib/services/data";
import type { ServiceWithQuestions } from "@/lib/quote/types";
import type { Tables } from "@/lib/database.types";

export type FeaturedItem = Pick<
  Tables<"gallery_items">,
  "id" | "title" | "before_image_url" | "after_image_url"
>;

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

export type HomeData = {
  services: ServiceWithQuestions[];
  featured: FeaturedItem[];
  heroSlides: HeroSlide[];
  showcase: ShowcasePanel[];
};

/**
 * Everything the homepage renders. Reads only anon-visible tables through
 * `createPublicClient`, so the page stays statically renderable — see
 * `lib/supabase/public.ts` for why that matters.
 */
export async function getHomeData(): Promise<HomeData> {
  if (!isSupabaseConfigured()) {
    return {
      services: await getActiveServices(),
      featured: DEMO_FEATURED,
      heroSlides: [],
      showcase: DEMO_SHOWCASE,
    };
  }

  const supabase = createPublicClient();
  // One parallel round trip — getActiveServices used to be awaited first,
  // which cost an extra sequential hop to the database for nothing.
  const [services, galleryRes, heroRes, showcaseRes] = await Promise.all([
    getActiveServices(),
    supabase
      .from("gallery_items")
      .select("id, title, before_image_url, after_image_url")
      .order("featured", { ascending: false })
      .order("sort_order")
      .limit(4),
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
    heroSlides: heroRes.data ?? [],
    showcase,
  };
}
