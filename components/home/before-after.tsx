/* eslint-disable @next/next/no-img-element -- gallery uses public bucket URLs */
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/home/reveal";
import { SectionHeader } from "@/components/home/section-header";
import type { FeaturedItem } from "@/lib/home/data";

function Media({ url, label }: { url: string; label: string }) {
  if (url) {
    return (
      <div className="relative">
        <img src={url} alt={label} className="aspect-[4/3] w-full object-cover" />
        <span className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium uppercase text-white">
          {label}
        </span>
      </div>
    );
  }
  // Placeholder when no image is set yet.
  return (
    <div className="relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-neutral-200 to-neutral-300">
      <span className="absolute left-2 top-2 rounded bg-black/40 px-1.5 py-0.5 text-[10px] font-medium uppercase text-white">
        {label}
      </span>
      <span className="text-xs text-neutral-500">Photo coming soon</span>
    </div>
  );
}

export function BeforeAfter({ items }: { items: FeaturedItem[] }) {
  const shown = items.slice(0, 2);
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <SectionHeader
        number="03"
        eyebrow="Recent work"
        title="Before & after"
        action={
          <Link href="/gallery" className="text-sm font-medium hover:underline">
            See our work →
          </Link>
        }
      />

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {shown.map((item, i) => (
          <Reveal key={item.id} delay={i * 120} as="div">
            <div className="overflow-hidden rounded-2xl border">
              <div className="grid grid-cols-2">
                <Media url={item.before_image_url} label="Before" />
                <Media url={item.after_image_url ?? ""} label="After" />
              </div>
              <p className="p-4 font-medium">{item.title}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-6 text-center sm:hidden">
        <Link href="/gallery" className="inline-flex items-center gap-1 text-sm font-medium hover:underline">
          See our work <ArrowRight className="size-4" />
        </Link>
      </Reveal>
    </section>
  );
}
