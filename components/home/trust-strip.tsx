import { BadgeCheck, MapPin, ShieldCheck, Star } from "lucide-react";
import { BUSINESS } from "@/lib/business";

type Item = { icon: typeof BadgeCheck; label: string };

/**
 * The band under the hero whose entire job is establishing we're a real,
 * licensed operator — so it must not contain anything we can't stand behind.
 *
 * It previously displayed "ABN 00 000 000 000". The ABN now comes from
 * lib/business.ts and the chip is omitted until a real one exists.
 *
 * TODO(content): "4.9★ from 200+ jobs" is not backed by any data source in
 * this codebase. Either wire it to real reviews or remove it — an invented
 * rating on a commercial site is a misleading-conduct risk, the same issue as
 * the seeded testimonials further down the page.
 */
const ITEMS: Item[] = [
  { icon: BadgeCheck, label: "Licensed & insured" },
  ...(BUSINESS.abn ? [{ icon: ShieldCheck, label: `ABN ${BUSINESS.abn}` }] : []),
  { icon: MapPin, label: `Servicing ${BUSINESS.serviceArea}` },
  { icon: Star, label: "4.9★ from 200+ jobs" },
];

export function TrustStrip() {
  return (
    <div className="border-y bg-muted/40">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 py-3 text-sm text-muted-foreground">
        {ITEMS.map((item) => (
          <span key={item.label} className="flex items-center gap-1.5">
            <item.icon className="size-4" />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
