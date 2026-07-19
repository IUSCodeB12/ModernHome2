import { BadgeCheck, MapPin, ShieldCheck, Star } from "lucide-react";

const ITEMS = [
  { icon: BadgeCheck, label: "Licensed & insured" },
  { icon: ShieldCheck, label: "ABN 00 000 000 000" },
  { icon: MapPin, label: "Servicing Greater Melbourne" },
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
