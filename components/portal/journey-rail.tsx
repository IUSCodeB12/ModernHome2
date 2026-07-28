import { cn } from "@/lib/utils";
import { JOURNEY_STEPS, stepState, type Journey } from "@/lib/bookings/journey";

/**
 * Five-stage progress rail. The bar is the signal; labels stay small so the
 * whole journey fits across a phone without wrapping.
 *
 * Only the request date is shown — the bookings table has no per-stage
 * timestamps, so anything else would be invented.
 */
export function JourneyRail({
  journey,
  requestedOn,
}: {
  journey: Journey;
  requestedOn: string;
}) {
  return (
    <ol
      className={cn(
        "grid grid-cols-5 gap-1.5 sm:gap-3",
        journey.cancelled && "opacity-60"
      )}
      aria-label="Job progress"
    >
      {JOURNEY_STEPS.map((step, i) => {
        const state = stepState(journey, i);
        return (
          <li key={step} aria-current={state === "active" ? "step" : undefined}>
            <div
              className={cn(
                "h-[3px] rounded-full transition-colors",
                state === "done" && "bg-foreground/60",
                state === "active" && "bg-brand",
                state === "upcoming" && "bg-border"
              )}
            />
            <p
              className={cn(
                "mt-2 text-[11px] leading-tight sm:text-xs",
                state === "upcoming"
                  ? "text-muted-foreground"
                  : "font-medium text-foreground"
              )}
            >
              {step}
            </p>
            {i === 0 && (
              <p className="mt-0.5 text-[10px] text-muted-foreground sm:text-[11px]">
                {requestedOn}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
