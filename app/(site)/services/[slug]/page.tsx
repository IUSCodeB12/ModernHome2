import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArViewer } from "@/components/ar/ar-viewer";
import { EstimatePreview } from "@/components/services/estimate-preview";
import { JsonLd } from "@/components/seo/json-ld";
import { getServiceBySlug } from "@/lib/services/data";
import { getServiceContent } from "@/lib/services/content";
import { formatAud, parseOptions } from "@/lib/quote/estimate";
import { breadcrumbLd, faqLd, serviceLd } from "@/lib/seo/json-ld";

export const dynamic = "force-dynamic";

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

  const highlights = service.service_questions
    .flatMap((q) => parseOptions(q.options).slice(0, 2).map((o) => o.label))
    .slice(0, 6);

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

      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{service.name}</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
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
          <Link href="/quote">
            Get an instant quote <ArrowRight />
          </Link>
        </Button>
      </div>

      <div className="mt-10">
        <EstimatePreview service={service} />
      </div>

      {highlights.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold">Options we cover</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {highlights.map((label) => (
              <li key={label} className="flex items-center gap-2 text-sm">
                <Check className="size-4 text-green-600" /> {label}
              </li>
            ))}
          </ul>
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

      {service.ar_model_glb_url && (
        <div className="mt-10">
          <ArViewer
            glbUrl={service.ar_model_glb_url}
            usdzUrl={service.ar_model_usdz_url}
            poster={service.hero_image_url}
            alt={`3D model of ${service.name}`}
          />
        </div>
      )}
    </div>
  );
}
