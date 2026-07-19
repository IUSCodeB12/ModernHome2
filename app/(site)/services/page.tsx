import Link from "next/link";
import { ArrowRight, Boxes } from "lucide-react";
import { getActiveServices } from "@/lib/services-data";
import { formatAud } from "@/lib/quote/estimate";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const services = await getActiveServices();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Services</h1>
      <p className="mt-1 text-muted-foreground">
        Fixed, transparent pricing — get an instant estimate online.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <Link
            key={service.id}
            href={`/services/${service.slug}`}
            className="group rounded-2xl border p-5 transition-colors hover:border-foreground/30"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{service.name}</h2>
              {service.ar_model_glb_url && (
                <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  <Boxes className="size-3" /> AR
                </span>
              )}
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
              {service.description}
            </p>
            <p className="mt-3 text-sm">
              from{" "}
              <span className="font-semibold">
                {formatAud(service.base_price_cents)}
              </span>
              {service.price_unit === "per_metre" && " / metre"}
              {service.price_unit === "per_hour" && " / hour"}
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-foreground/70 group-hover:text-foreground">
              View details <ArrowRight className="size-3.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
