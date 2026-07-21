import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArViewer } from "@/components/ar/ar-viewer";
import { EstimatePreview } from "@/components/services/estimate-preview";
import { getServiceBySlug } from "@/lib/services/data";
import { formatAud, parseOptions } from "@/lib/quote/estimate";

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

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12">
      <p className="text-sm text-muted-foreground">
        <Link href="/services" className="hover:underline">
          Services
        </Link>{" "}
        / {service.name}
      </p>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{service.name}</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">{service.description}</p>
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
