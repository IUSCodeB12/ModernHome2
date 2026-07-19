"use client";

import Image from "next/image";
import { Hammer } from "lucide-react";
import { formatAud } from "@/lib/quote/estimate";
import type { ServiceWithQuestions } from "@/lib/quote/types";
import { cn } from "@/lib/utils";

export function StepService({
  services,
  selectedId,
  onSelect,
}: {
  services: ServiceWithQuestions[];
  selectedId: string | null;
  onSelect: (service: ServiceWithQuestions) => void;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold">What do you need done?</h2>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {services.map((service) => (
          <button
            key={service.id}
            type="button"
            onClick={() => onSelect(service)}
            className={cn(
              "overflow-hidden rounded-xl border text-left transition-colors",
              selectedId === service.id
                ? "border-primary ring-2 ring-primary"
                : "hover:border-foreground/30"
            )}
          >
            <div className="relative flex h-28 items-center justify-center bg-gradient-to-br from-neutral-200 to-neutral-300">
              {service.hero_image_url ? (
                <Image
                  src={service.hero_image_url}
                  alt={service.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 320px"
                />
              ) : (
                <Hammer className="size-8 text-neutral-500" aria-hidden />
              )}
            </div>
            <div className="p-3">
              <p className="font-medium">{service.name}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                from {formatAud(service.base_price_cents)}
                {service.price_unit === "per_metre" && " / metre"}
                {service.price_unit === "per_hour" && " / hour"}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
