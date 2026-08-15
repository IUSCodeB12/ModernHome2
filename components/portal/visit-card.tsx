import { Clock, KeyRound, MapPin } from "lucide-react";
import { RescheduleRequest } from "@/components/portal/reschedule-request";

function Fact({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof Clock;
  title: string;
  detail?: string | null;
}) {
  return (
    <div className="flex gap-3 border-t py-3 first:border-t-0 first:pt-0">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        {detail && <p className="text-sm text-muted-foreground">{detail}</p>}
      </div>
    </div>
  );
}

/**
 * Where we're coming, or where we came.
 *
 * The arrival time is deliberately absent while the visit is ahead — the hero's
 * ticket owns it, and a second copy three inches below it made the page look
 * like it was hedging. Once the job is done the ticket is gone, so the date
 * comes back here as the record of what happened.
 */
export function VisitCard({
  arrival,
  past,
  address,
  installer,
  accessNotes,
  quoteId,
  canReschedule,
  rescheduleRequested,
}: {
  arrival: string | null;
  /** The visit has already happened — show it as history, not as a plan. */
  past: boolean;
  address: string | null;
  installer: string | null;
  accessNotes: string | null;
  quoteId: string;
  canReschedule: boolean;
  rescheduleRequested: boolean;
}) {
  if (!arrival && !address) return null;

  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="mb-3 font-medium">{past ? "The visit" : "Where we're coming"}</h2>

      {past && arrival && (
        <Fact
          icon={Clock}
          title={arrival}
          detail={installer ? `${installer} did the job` : null}
        />
      )}

      {/* No installer line while the visit is ahead — the hero's ticket already
          names them, and this card sits a screen below it. */}
      {address && <Fact icon={MapPin} title={address} />}

      {accessNotes && <Fact icon={KeyRound} title="Access notes" detail={accessNotes} />}

      {canReschedule && (
        <div className="mt-4 border-t pt-4">
          <RescheduleRequest
            quoteId={quoteId}
            alreadyRequested={rescheduleRequested}
          />
        </div>
      )}
    </section>
  );
}
