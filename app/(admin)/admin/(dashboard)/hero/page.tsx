import { HeroSlidesManager } from "@/components/admin/hero-slides-manager";
import { getHeroSlidesAdmin } from "@/lib/admin/hero-data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Hero slideshow" };

export default async function AdminHeroPage() {
  const { slides, demo } = await getHeroSlidesAdmin();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight">Hero slideshow</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {demo
          ? "Demo mode — connect Supabase to manage slides."
          : "Photos that rotate in the homepage hero, in order."}
      </p>
      <div className="mt-6">
        <HeroSlidesManager initial={slides} configured={!demo} />
      </div>
    </div>
  );
}
