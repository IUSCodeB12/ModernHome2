"use client";

import { Check } from "lucide-react";
import { AnimatedPrice } from "@/components/quote/animated-price";
import { cn } from "@/lib/utils";

/**
 * Numbered brass progress rail for the quote wizard. A hairline connects the
 * step nodes and fills brass up to the current step; done steps collapse to a
 * brass tick, the active step is a filled dot, upcoming steps are hollow. The
 * numeric language matches the section indices used across the site.
 *
 * The rail also carries the running estimate, which used to appear only on the
 * details step and vanish for the rest of the flow. Keeping the figure on
 * screen is the whole reward loop — the customer can see what their answers are
 * worth right up to the moment they confirm.
 *
 * The label track under the rail is desktop-only; on mobile a single
 * "Step N of M · Label" line carries the same information without crowding.
 */
export function ProgressRail({
  labels,
  current,
  onStepSelect,
  price,
}: {
  labels: string[];
  current: number;
  /** Jump back to an already-completed step. Forward steps stay locked. */
  onStepSelect?: (step: number) => void;
  price?: { low: number; high: number } | null;
}) {
  const pct = labels.length > 1 ? (current / (labels.length - 1)) * 100 : 0;

  return (
    <div className="mb-8">
      <div className="relative">
        {/* Base + filled hairline, centred on the nodes */}
        <div className="absolute left-0 right-0 top-[11px] h-px bg-border" />
        <div
          className="absolute left-0 top-[11px] h-px bg-brand transition-[width] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{ width: `${pct}%` }}
        />

        <ol className="relative flex justify-between">
          {labels.map((label, i) => {
            const done = i < current;
            const active = i === current;
            const canJump = done && !!onStepSelect;
            return (
              <li key={label} className="flex flex-col items-center">
                <button
                  type="button"
                  disabled={!canJump}
                  onClick={canJump ? () => onStepSelect(i) : undefined}
                  aria-label={canJump ? `Back to ${label}` : label}
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "flex size-[22px] items-center justify-center rounded-full border bg-background text-[10px] font-medium tabular-nums transition-colors duration-300",
                    done && "border-brand bg-brand text-brand-foreground",
                    active && "border-brand text-brand ring-2 ring-brand/20",
                    !done && !active && "border-border text-muted-foreground",
                    canJump && "cursor-pointer hover:ring-2 hover:ring-brand/30"
                  )}
                >
                  {done ? (
                    <Check className="size-3" />
                  ) : (
                    String(i + 1).padStart(2, "0")
                  )}
                </button>
                <span
                  className={cn(
                    "mt-2 hidden text-[11px] tracking-wide sm:block",
                    active
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Current step + running price. Stacked on mobile, one line on desktop. */}
      <div className="mt-3 flex items-center justify-between gap-3 sm:mt-4">
        <p className="text-sm text-muted-foreground sm:hidden">
          Step {current + 1} of {labels.length} ·{" "}
          <span className="font-medium text-foreground">{labels[current]}</span>
        </p>
        <span className="hidden sm:block" />
        {price && (
          <span className="flex shrink-0 items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-sm">
            <span className="text-xs text-muted-foreground">Estimate</span>
            <span className="font-semibold">
              <AnimatedPrice cents={price.low} /> –{" "}
              <AnimatedPrice cents={price.high} />
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
