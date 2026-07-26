import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Numbered brass progress rail for the quote wizard. A hairline connects the
 * step nodes and fills brass up to the current step; done steps collapse to a
 * brass tick, the active step is a filled dot, upcoming steps are hollow. The
 * numeric language matches the section indices used across the site.
 *
 * The label track under the rail is desktop-only; on mobile a single
 * "Step N of M · Label" line carries the same information without crowding.
 */
export function ProgressRail({
  labels,
  current,
}: {
  labels: string[];
  current: number;
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
            return (
              <li key={label} className="flex flex-col items-center">
                <span
                  className={cn(
                    "flex size-[22px] items-center justify-center rounded-full border bg-background text-[10px] font-medium tabular-nums transition-colors duration-300",
                    done && "border-brand bg-brand text-brand-foreground",
                    active && "border-brand text-brand ring-2 ring-brand/20",
                    !done && !active && "border-border text-muted-foreground"
                  )}
                >
                  {done ? <Check className="size-3" /> : String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className={cn(
                    "mt-2 hidden text-[11px] tracking-wide sm:block",
                    active ? "font-medium text-foreground" : "text-muted-foreground"
                  )}
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Mobile: compact current-step line */}
      <p className="mt-3 text-sm text-muted-foreground sm:hidden">
        Step {current + 1} of {labels.length} ·{" "}
        <span className="font-medium text-foreground">{labels[current]}</span>
      </p>
    </div>
  );
}
