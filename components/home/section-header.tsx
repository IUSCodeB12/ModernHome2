import { Reveal } from "@/components/home/reveal";
import { StaggerTitle } from "@/components/home/stagger-title";
import { cn } from "@/lib/utils";

/**
 * Editorial section header: numbered eyebrow with a brass rule,
 * then a large display-serif title. Optional right-aligned action link.
 */
export function SectionHeader({
  number,
  eyebrow,
  title,
  action,
  align = "left",
  dark = false,
}: {
  number: string;
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
  align?: "left" | "center";
  dark?: boolean;
}) {
  return (
    <Reveal
      className={cn(
        "flex items-end justify-between gap-6",
        align === "center" && "justify-center text-center"
      )}
    >
      <div className={cn(align === "center" && "flex flex-col items-center")}>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "font-display text-sm tabular-nums",
              dark ? "text-white/50" : "text-brand"
            )}
          >
            {number}
          </span>
          <span className="h-px w-10 bg-brand/60" />
          <span
            className={cn(
              "text-xs font-medium uppercase tracking-[0.2em]",
              dark ? "text-white/60" : "text-muted-foreground"
            )}
          >
            {eyebrow}
          </span>
        </div>
        <h2
          className={cn(
            "mt-4 text-4xl sm:text-5xl",
            dark ? "text-white" : "text-foreground"
          )}
        >
          <StaggerTitle text={title} />
        </h2>
      </div>
      {action && <div className="hidden shrink-0 pb-1 sm:block">{action}</div>}
    </Reveal>
  );
}
