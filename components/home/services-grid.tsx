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

export function ServicesGrid({ services }: { services: ServiceWithQuestions[] }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <SectionHeader
        number="02"
        eyebrow="What we do"
        title="Fixed prices, no surprises"
        action={
          <Link href="/services" className="text-sm font-medium hover:underline">
            All services →
          </Link>
        }
      />

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service, i) => (
          <Reveal key={service.id} delay={i * 80} as="div">
            <Link
              href={`/services/${service.slug}`}
              className="group flex h-full flex-col rounded-2xl border p-5 transition-all duration-300 ease-out hover:-translate-y-1 hover:rotate-[-0.4deg] hover:shadow-lg"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-semibold">{service.name}</h3>
                {service.ar_model_glb_url && (
                  <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    <Boxes className="size-3" /> AR
                  </span>
                )}
              </div>
              <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted-foreground">
                {service.description}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm">
                  from{" "}
                  <span className="font-semibold">{formatAud(service.base_price_cents)}</span>
                  <span className="text-muted-foreground">{unitSuffix(service.price_unit)}</span>
                </span>
                <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
