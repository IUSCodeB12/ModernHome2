import { cn } from "@/lib/utils";
import type { JourneyTone } from "@/lib/bookings/journey";

/**
 * Status pill for the customer portal.
 *
 * Deliberately separate from the admin `StatusBadge`: a dense pipeline board
 * benefits from many hues, but a homeowner looking at one job needs to know
 * only whether the ball is in their court. Colour lives in a single dot so the
 * label always keeps full-contrast text.
 */
const DOT: Record<JourneyTone, string> = {
  waiting: "bg-muted-foreground/40",
  action: "bg-brand",
  live: "bg-brand animate-pulse",
  done: "bg-emerald-600",
  closed: "bg-muted-foreground/30",
};

export function PortalStatus({
  label,
  tone,
  className,
}: {
  label: string;
  tone: JourneyTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium",
        tone === "closed" ? "text-muted-foreground" : "text-foreground",
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", DOT[tone])} aria-hidden />
      {label}
    </span>
  );
}
