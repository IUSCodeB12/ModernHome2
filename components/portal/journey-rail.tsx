import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { JOURNEY_STEPS, stepState, type Journey } from "@/lib/bookings/journey";
import { stageStyle } from "@/components/portal/stage-theme";
import type { BookingStatus } from "@/lib/bookings/status";

/**
 * Five-stage progress rail.
 *
 * Nodes on a connecting line rather than the five detached 3px bars this
 * replaced. The bars technically encoded the same five states, but they read as
 * a loading indicator: nothing about them said the stages were sequential, or
 * that you were somewhere along a path with a known end.
 *
 * Ticks are the whole point of the redraw — a stage you've already cleared
 * should look cleared, not merely darker than the one after it.
 *
 * Only the request date is shown. The bookings table has no per-stage
 * timestamps, so anything else on here would be invented.
 */
export function JourneyRail({
  journey,
  status,
  requestedOn,
}: {
  journey: Journey;
  status: BookingStatus;
  requestedOn: string;
}) {
  const style = stageStyle(status);

  return (
    <ol
      className={cn("grid grid-cols-5", journey.cancelled && "opacity-50")}
      aria-label="Job progress"
    >
      {JOURNEY_STEPS.map((step, i) => {
        const state = stepState(journey, i);
        const reached = state !== "upcoming";

        return (
          <li
            key={step}
            aria-current={state === "active" ? "step" : undefined}
            className="animate-enter-up relative flex flex-col items-center text-center"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            {/* Connector back to the previous node. Inset by the node's radius
                at both ends so it meets the discs rather than passing behind
                them — a hairline crossing a filled circle shows through at
                fractional device pixels however the stacking is ordered. */}
            {i > 0 && (
              <span
                aria-hidden
                className={cn(
                  "absolute left-[calc(-50%+12px)] right-[calc(50%+12px)] top-3 h-px",
                  reached ? "bg-foreground/25" : "bg-border"
                )}
              />
            )}

            <span
              aria-hidden
              className={cn(
                "relative z-10 flex size-6 items-center justify-center rounded-full border transition-colors",
                state === "done" && "border-transparent bg-foreground/80",
                // Solid disc with a halo, no glyph — the tick is what marks a
                // stage as *finished*, so putting one here too would say the
                // opposite of what this node means.
                state === "active" &&
                  cn("border-transparent ring-4 ring-brand/15", style.strong),
                state === "upcoming" && "border-border bg-background"
              )}
            >
              {state === "done" && (
                <Check className="size-3.5 text-background" strokeWidth={3} />
              )}
            </span>

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
