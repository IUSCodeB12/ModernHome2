import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PortalStatus } from "@/components/portal/portal-status";
import { stageStyle } from "@/components/portal/stage-theme";
import type { Journey } from "@/lib/bookings/journey";
import type { BookingStatus } from "@/lib/bookings/status";
import { cn } from "@/lib/utils";

/**
 * A job in the secondary lists.
 *
 * The accent bar on the left is the only colour, and it's what lets you scan a
 * finished job apart from a live one without reading a word — the status pill
 * hides below `sm`, so on a phone it's the sole signal.
 */
export function JobRow({
  id,
  serviceName,
  status,
  journey,
  meta,
  amount,
}: {
  id: string;
  serviceName: string;
  status: BookingStatus;
  journey: Journey;
  meta: string;
  amount: string | null;
}) {
  const style = stageStyle(status);

  return (
    <li>
      <Link
        href={`/portal/${id}`}
        className="group flex items-center gap-3 rounded-lg py-3 pl-3 transition-colors hover:bg-muted/50"
      >
        <span
          aria-hidden
          className={cn("h-8 w-0.5 shrink-0 rounded-full", style.fill)}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{serviceName}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{meta}</p>
        </div>
        {amount && (
          <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
            {amount}
          </span>
        )}
        <PortalStatus
          label={journey.label}
          tone={journey.tone}
          className="hidden shrink-0 sm:inline-flex"
        />
        <ChevronRight className="mr-2 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </Link>
    </li>
  );
}
