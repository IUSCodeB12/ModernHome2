import { Star } from "lucide-react";
import { Reveal } from "@/components/home/reveal";
import { SectionHeader } from "@/components/home/section-header";

const TESTIMONIALS = [
  {
    quote:
      "Quoted online on Sunday night, TV on the wall Wednesday. The cable concealment is invisible — wall looks untouched.",
    name: "Jordan N.",
    suburb: "Richmond",
    service: "TV Wall Mounting",
  },
  {
    quote:
      "The floating cabinet with the LED glow is the first thing everyone comments on. Measured twice, fit perfectly.",
    name: "Priya S.",
    suburb: "Carlton",
    service: "Floating Cabinet",
  },
  {
    quote:
      "Knew the price before anyone came out — no awkward callout fee dance. Kickboard lights transformed the kitchen.",
    name: "Marcus T.",
    suburb: "Brunswick",
    service: "LED Strip Lighting",
  },
];

export function Testimonials() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <SectionHeader number="05" eyebrow="Word of mouth" title="Neighbours talk" />

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {TESTIMONIALS.map((t, i) => (
          <Reveal key={t.name} delay={i * 110} as="div">
            <figure className="card-lift flex h-full flex-col rounded-2xl border bg-card p-6">
              <div className="flex gap-0.5 text-brand" role="img" aria-label="5 star rating">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} className="size-4 fill-current" />
                ))}
              </div>
              <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-5 border-t pt-4 text-sm">
                <span className="font-medium">{t.name}</span>
                <span className="text-muted-foreground">
                  {" "}
                  · {t.suburb} · {t.service}
                </span>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
