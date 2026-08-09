import Link from "next/link";
import { ArrowRight, Camera, MapPin, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/home/reveal";
import { CtaFinale } from "@/components/home/cta-finale";
import { GalleryGrid } from "@/components/gallery/gallery-grid";
import { getGalleryItems } from "@/lib/gallery/data";

// Static + revalidated. Admin edits call revalidatePath, so changes are
// immediate; this is just a safety net.
export const revalidate = 3600;

export const metadata = {
  title: "Our work",
  description:
    "Finished installations from our recent jobs — TV walls, floating and showcase cabinets, and LED strip lighting. Browse the work, then get a fixed price for yours.",
};

const NOTES = [
  { icon: Camera, label: "Photographed on handover" },
  { icon: MapPin, label: "Melbourne homes" },
  { icon: Ruler, label: "Built to the room" },
];

export default async function GalleryPage() {
  const { items, filters, demo } = await getGalleryItems();

  return (
    <>
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-20">
        {/* Editorial masthead — same voice as /services. */}
        <Reveal>
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-brand">
            Our work
          </p>
          <h1 className="mt-4 max-w-2xl font-serif text-4xl leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            The rooms, once we&rsquo;ve left them.
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            Cabinetry, lighting and TV walls from recent jobs. Tap any photo to
            see it full size.
            {demo && " (Sample projects — Supabase not configured.)"}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4">
            <ul className="flex flex-wrap items-center gap-x-7 gap-y-3">
              {NOTES.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <Icon className="size-4 text-brand" />
                  {label}
                </li>
              ))}
            </ul>
            <Button asChild>
              <Link href="/quote">
                Get an instant quote <ArrowRight />
              </Link>
            </Button>
          </div>
        </Reveal>

        <div className="mt-12 sm:mt-14">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No projects yet — check back soon.
            </p>
          ) : (
            <GalleryGrid items={items} filters={filters} />
          )}
        </div>
      </div>

      <CtaFinale />
    </>
  );
}
