import Link from "next/link";
import { ArrowUpRight, Boxes } from "lucide-react";
import { Reveal } from "@/components/home/reveal";
import { SectionHeader } from "@/components/home/section-header";
import { formatAud } from "@/lib/quote/estimate";
import type { ServiceWithQuestions } from "@/lib/quote/types";

function unitSuffix(unit: string): string {
  if (unit === "per_metre") return " / m";
  if (unit === "per_hour") return " / hr";
  return "";
}

/**
 * Services as an editorial price index rather than a card grid — the section
 * promises "fixed prices, no surprises", so it should read like a price list:
 * numbered hairline rows, serif names, prices set in the display face and
 * right-aligned into a column the eye can scan straight down.
 *
 * Server-rendered; all motion is CSS on hover/focus, no client JS.
 */
export function ServicesGrid({ services }: { services: ServiceWithQuestions[] }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 lg:py-28">
      <SectionHeader
        number="03"
        eyebrow="What we do"
        title="Fixed prices, no surprises"
        action={
          <Link
            href="/services"
            className="group hidden items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
          >
            All services
            <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        }
      />

      <div className="mt-12 border-t border-border/70">
        {services.map((service, i) => (
          <Reveal key={service.id} delay={i * 70} as="div">
            <Link
              href={`/services/${service.slug}`}
              className="group relative block border-b border-border/70 transition-colors duration-300 hover:bg-brand/[0.035] focus-visible:bg-brand/[0.035] focus-visible:outline-none"
            >
              {/* Brass rule that draws in from the left on hover */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-[-1px] h-px origin-left scale-x-0 bg-brand transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-x-100 group-focus-visible:scale-x-100"
              />

              <div className="flex items-baseline gap-4 px-1 py-7 sm:gap-6 sm:py-8 md:px-3">
                {/* Index numeral */}
                <span className="w-7 shrink-0 font-mono text-xs tabular-nums text-muted-foreground/70 transition-colors duration-300 group-hover:text-brand">
                  {String(i + 1).padStart(2, "0")}
                </span>

                {/* Name + description */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className="font-serif text-2xl leading-tight tracking-tight transition-transform duration-300 ease-out group-hover:translate-x-0.5 sm:text-[1.75rem]">
                      {service.name}
                    </h3>
                    {service.ar_model_glb_url && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-brand/35 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-brand">
                        <Boxes className="size-3" /> AR
                      </span>
                    )}
                  </div>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]">
                    {service.description}
                  </p>

                  {/* Price sits inline on mobile, where there's no room for a column */}
                  <p className="mt-3 sm:hidden">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">
                      from{" "}
                    </span>
                    <span className="font-serif text-xl">
                      {formatAud(service.base_price_cents)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {unitSuffix(service.price_unit)}
                    </span>
                  </p>
                </div>

                {/* Price column — scannable straight down the right edge, with
                    the arrow on the same baseline as the figure */}
                <div className="flex shrink-0 items-baseline gap-5">
                  <div className="hidden text-right sm:block">
                    <p className="text-[0.7rem] uppercase tracking-wider text-muted-foreground">
                      from
                    </p>
                    <p className="mt-1 whitespace-nowrap font-serif text-2xl leading-none">
                      {formatAud(service.base_price_cents)}
                      <span className="text-base text-muted-foreground">
                        {unitSuffix(service.price_unit)}
                      </span>
                    </p>
                  </div>
                  <ArrowUpRight className="size-5 shrink-0 translate-y-1 text-muted-foreground/50 transition-all duration-300 ease-out group-hover:translate-x-0.5 group-hover:translate-y-0 group-hover:text-brand" />
                </div>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>

      <Link
        href="/services"
        className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium hover:underline sm:hidden"
      >
        All services <ArrowUpRight className="size-4" />
      </Link>
    </section>
  );
}
