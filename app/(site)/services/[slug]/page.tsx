import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArViewer } from "@/components/ar/ar-viewer";
import { EstimatePreview } from "@/components/services/estimate-preview";
import { JsonLd } from "@/components/seo/json-ld";
import { getActiveServices, getServiceBySlug, getServicePhotos } from "@/lib/services/data";
import { getServiceContent, serviceCoverage } from "@/lib/services/content";
import { formatAud } from "@/lib/quote/estimate";
import { breadcrumbLd, faqLd, serviceLd } from "@/lib/seo/json-ld";

// Static + revalidated. Admin edits call revalidatePath, so changes are
// immediate; this is just a safety net.
export const revalidate = 3600;

/**
 * Prerender every service page at build time. Without this the segment stays
 * dynamic and each page is server-rendered on demand — there are only a
 * handful of services, so building them all is cheap and makes them CDN-served.
 */
export async function generateStaticParams() {
  const services = await getActiveServices();
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) return { title: "Service not found" };
  return {
    title: service.name,
    description:
      service.description ??
      `Get an instant, fixed-price quote for ${service.name} and book online.`,
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) notFound();

  // Curated showcase photo doubles as the AR poster; hero_image_url is the
  // older per-service field and is mostly unset.
  const photos = await getServicePhotos();
  const photo = photos[service.id] ?? service.hero_image_url;

  const coverage = serviceCoverage(service.service_questions);

  const content = getServiceContent(slug);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12">
      <JsonLd
        data={[
          serviceLd(service),
          faqLd(content.faqs),
          breadcrumbLd([
            { name: "Services", path: "/services" },
            { name: service.name, path: `/services/${service.slug}` },
          ]),
        ]}
      />
      <p className="text-sm text-muted-foreground">
        <Link href="/services" className="hover:underline">
          Services
        </Link>{" "}
        / {service.name}
      </p>

      {/*
       * Lead with the work. This photo was already being fetched for the AR
       * poster at the foot of the page — a page selling a visual trade has no
       * business opening with a wall of text when the image is right here.
       */}
      {photo && (
        <div className="relative mt-4 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border bg-[#1a1714] shadow-elev-3 sm:aspect-[21/9]">
          {/* eslint-disable-next-line @next/next/no-img-element -- public bucket URL, no next/image domain config */}
          <img
            src={photo}
            alt={`${service.name} — completed job`}
            className="size-full object-cover"
            fetchPriority="high"
          />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(20,18,16,0.4))]" />
          <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-[#c9a24b]/20" />
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="max-w-xl text-balance text-4xl leading-[1.1] tracking-tight sm:text-5xl">
            {service.name}
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            {service.description ?? content.tagline}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">from</p>
          <p className="text-3xl font-bold">
            {formatAud(service.base_price_cents)}
            {service.price_unit === "per_metre" && (
              <span className="text-base font-normal text-muted-foreground"> / metre</span>
            )}
            {service.price_unit === "per_hour" && (
              <span className="text-base font-normal text-muted-foreground"> / hour</span>
            )}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild size="lg">
          {/* Carry the slug — this used to drop people into the wizard with
              nothing selected, so they had to pick the service twice. */}
          <Link href={`/quote?service=${service.slug}`}>
            Get an instant quote <ArrowRight />
          </Link>
        </Button>
      </div>

      <div className="mt-10">
        <EstimatePreview service={service} />
      </div>

      {coverage.length > 0 && (
        <section className="mt-12">
          <h2 className="font-serif text-2xl">Options we cover</h2>
          <dl className="mt-4 grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {coverage.map((row) => (
              <div key={row.label} className="border-t pt-3">
                <dt className="text-sm text-muted-foreground">{row.label}</dt>
                <dd className="mt-1.5 flex flex-wrap gap-1.5">
                  {row.values.map((value) => (
                    <span
                      key={value}
                      className="inline-flex items-center gap-1 rounded-full border bg-card px-2.5 py-1 text-sm"
                    >
                      <Check className="size-3.5 text-emerald-600" />
                      {value}
                    </span>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section className="mt-12">
        <h2 className="font-serif text-2xl">How it works</h2>
        <ol className="mt-5 grid gap-4 sm:grid-cols-2">
          {content.process.map((step, i) => (
            <li key={step.title} className="rounded-xl border bg-card p-4">
              <span className="flex size-7 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
                {i + 1}
              </span>
              <p className="mt-3 font-medium">{step.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{step.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12 grid gap-8 sm:grid-cols-2">
        <div>
          <h2 className="font-serif text-2xl">What&apos;s included</h2>
          <ul className="mt-4 space-y-2">
            {content.includes.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-green-600" /> {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Ready when you are</p>
          <p className="mt-1 font-serif text-xl">Fixed price, no callout fee.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            See your exact price and lock in a 2-hour arrival window in about 3 minutes.
          </p>
          <Button asChild className="mt-4">
            <Link href="/quote">
              Get an instant quote <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-2xl">Frequently asked</h2>
        <div className="mt-4 divide-y rounded-xl border">
          {content.faqs.map((faq) => (
            <details key={faq.question} className="group px-4 py-3">
              <summary className="cursor-pointer list-none font-medium marker:content-none">
                {faq.question}
              </summary>
              <p className="mt-2 text-sm text-muted-foreground">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {(service.ar_model_glb_url || service.ar_model_usdz_url) && (
        <div className="mt-10">
          <ArViewer
            glbUrl={service.ar_model_glb_url}
            usdzUrl={service.ar_model_usdz_url}
            poster={photo}
            alt={`3D model of ${service.name}`}
          />
        </div>
      )}
    </div>
  );
}
