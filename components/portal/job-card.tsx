import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ArrivalTicket } from "@/components/portal/arrival-ticket";
import { PortalStatus } from "@/components/portal/portal-status";
import { stageStyle } from "@/components/portal/stage-theme";
import type { ArrivalParts } from "@/components/portal/stage-hero";
import type { Journey } from "@/lib/bookings/journey";
import type { BookingStatus } from "@/lib/bookings/status";
import { cn } from "@/lib/utils";

/**
 * The one job the customer is most likely here for, given the full-width
 * treatment on the list page.
 *
 * Shares its colour language and its centrepiece with the job page proper, so
 * arriving on the detail view feels like stepping into the same card rather
 * than loading a different product.
 */
export function JobCard({
  id,
  serviceName,
  status,
  journey,
  title,
  amount,
  arrival,
  slotStartMs,
  slotEndMs,
  installer,
}: {
  id: string;
  serviceName: string;
  status: BookingStatus;
  journey: Journey;
  title: string;
  amount: string | null;
  arrival: ArrivalParts | null;
  slotStartMs: number | null;
  slotEndMs: number | null;
  installer: string | null;
}) {
  const style = stageStyle(status);
  const upcoming =
    status === "approved" || status === "booked" || status === "in_progress";
  const leadsWithMoney = status === "quoted" || status === "invoiced";

  return (
    <Link
      href={`/portal/${id}`}
      className={cn(
        "card-lift animate-enter-up group block rounded-2xl border p-5 sm:p-6",
        style.surface
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
          {serviceName}
        </p>
        <PortalStatus label={journey.label} tone={journey.tone} />
      </div>

      <p className="mt-3 text-balance font-display text-xl leading-snug sm:text-2xl">
        {title}
      </p>

      {upcoming && arrival && (
        <ArrivalTicket
          {...arrival}
          installer={installer}
          slotStartMs={slotStartMs}
          slotEndMs={slotEndMs}
          className="mt-4"
        />
      )}

      {leadsWithMoney && amount && (
        <p className={cn("mt-4 font-display text-3xl leading-none", style.text)}>
          {amount}
        </p>
      )}

      <p className="mt-4 inline-flex items-center gap-1 text-sm font-medium transition-transform group-hover:translate-x-0.5">
        View job <ChevronRight className="size-4" />
      </p>
    </Link>
  );
}
