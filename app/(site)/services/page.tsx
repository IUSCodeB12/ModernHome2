/* eslint-disable @next/next/no-img-element -- public bucket URLs, no next/image domain config */

import Link from "next/link";
import { ArrowUpRight, Boxes, Clock, ShieldCheck, Wallet } from "lucide-react";
import { getActiveServices, getServicePhotos } from "@/lib/services/data";
import { formatAud } from "@/lib/quote/estimate";
import { Reveal } from "@/components/home/reveal";
import { CtaFinale } from "@/components/home/cta-finale";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Services & pricing",
  description:
    "Browse our home installation services — TV mounting, floating cabinets, showcase cabinets, LED strip lighting and heater installation. Fixed prices, instant online quotes.",
};

function unitSuffix(unit: string): string {
  if (unit === "per_metre") return " / m";
  if (unit === "per_hour") return " / hr";
  return "";
}

const ASSURANCES = [
  { icon: Wallet, label: "Fixed price up front" },
  { icon: Clock, label: "2-hour arrival windows" },
  { icon: ShieldCheck, label: "Licensed & fully insured" },
];

export default async function ServicesPage() {
  const [services, photos] = await Promise.all([
    getActiveServices(),
    getServicePhotos(),
  ]);

  return (
    <>
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-20">
        {/* Editorial masthead */}
        <Reveal>
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-brand">
            Services &amp; pricing
          </p>
          <h1 className="mt-4 max-w-2xl font-serif text-4xl leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Everything we install, priced in the open.
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            No callout to get a number. Pick a service, answer a few questions,
            and see your estimate before anyone comes out.
          </p>

          <ul className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3">
            {ASSURANCES.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Icon className="size-4 text-brand" />
                {label}
              </li>
            ))}
          </ul>
        </Reveal>

        {/* Photographic price index */}
        <div className="mt-14 border-t border-border/70">
          {services.map((service, i) => {
            const photo = photos[service.id];
            return (
              <Reveal key={service.id} delay={i * 70} as="div">
                <Link
                  href={`/services/${service.slug}`}
                  className="group relative block border-b border-border/70 transition-colors duration-300 hover:bg-brand/[0.035] focus-visible:bg-brand/[0.035] focus-visible:outline-none"
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 bottom-[-1px] h-px origin-left scale-x-0 bg-brand transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-x-100 group-focus-visible:scale-x-100"
                  />

                  <div className="flex items-center gap-5 px-1 py-6 sm:gap-7 sm:py-7 md:px-3">
                    {/* Thumbnail — curated in /admin/showcase */}
                    <div className="relative aspect-[4/3] w-20 shrink-0 self-start overflow-hidden rounded-lg border border-border bg-[#1a1714] sm:w-32 sm:self-auto lg:w-40">
                      {photo ? (
                        <img
                          src={photo}
                          alt=""
                          className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                          loading={i < 2 ? "eager" : "lazy"}
                        />
                      ) : (
                        <>
                          <span className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_35%,rgba(255,177,99,0.18),transparent_60%)]" />
                          <span className="absolute inset-0 bg-[radial-gradient(ellipse_at_25%_15%,rgba(201,162,75,0.12),transparent_55%)]" />
                        </>
                      )}
                    </div>

                    <span className="hidden w-7 shrink-0 self-start pt-1 font-mono text-xs tabular-nums text-muted-foreground/70 transition-colors duration-300 group-hover:text-brand md:block">
                      {String(i + 1).padStart(2, "0")}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <h2 className="font-serif text-2xl leading-tight tracking-tight transition-transform duration-300 ease-out group-hover:translate-x-0.5 sm:text-[1.75rem]">
                          {service.name}
                        </h2>
                        {service.ar_model_glb_url && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-brand/35 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-brand">
                            <Boxes className="size-3" /> AR
                          </span>
                        )}
                      </div>
                      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]">
                        {service.description}
                      </p>
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
                      <ArrowUpRight className="hidden size-5 shrink-0 translate-y-1 text-muted-foreground/50 transition-all duration-300 ease-out group-hover:translate-x-0.5 group-hover:translate-y-0 group-hover:text-brand sm:block" />
                    </div>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          Not sure which one you need?{" "}
          <Link
            href="/quote"
            className="font-medium text-foreground underline underline-offset-4"
          >
            Start a quote
          </Link>{" "}
          and we&apos;ll work it out with you.
        </p>
      </div>

      <CtaFinale />
    </>
  );
}
