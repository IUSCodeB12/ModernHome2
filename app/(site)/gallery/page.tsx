import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GalleryGrid } from "@/components/gallery/gallery-grid";
import { getGalleryItems } from "@/lib/gallery-data";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const { items, filters, demo } = await getGalleryItems();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Our work</h1>
          <p className="mt-1 text-muted-foreground">
            Drag the slider to see before &amp; after.
            {demo && " (Sample projects — Supabase not configured.)"}
          </p>
        </div>
        <Button asChild>
          <Link href="/quote">
            Get an instant quote <ArrowRight />
          </Link>
        </Button>
      </div>

      <div className="mt-8">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No projects yet — check back soon.
          </p>
        ) : (
          <GalleryGrid items={items} filters={filters} />
        )}
      </div>
    </div>
  );
}
