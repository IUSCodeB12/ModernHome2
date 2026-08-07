"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

/**
 * The lights-on/lights-off control: a pendant lamp that illuminates.
 *
 * Drawn as a line icon on lucide's 24px grid at 1.5 stroke, so it sits in the
 * same family as the menu button beside it and the feature icons below. An
 * earlier version was a photorealistic brass plate — conic-gradient specular
 * bands, nested radii, the lot — but at 20px none of that detail survives, and
 * a rendered object was the only skeuomorphic element in a system built
 * entirely from thin gold strokes. It read as a status LED rather than a
 * control.
 *
 * Lit, the shade fills, three short rays fade in beneath it, and the whole
 * glyph casts a warm drop shadow. Because it's a drawing rather than a plate,
 * the glow can be generous without turning into a blob.
 *
 * 20px glyph, 40px hit area — WCAG 2.5.8 wants 24px minimum targets.
 */
export function LightSwitch({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // next-themes can't resolve until it reads the client, so hold the unlit
  // state rather than guessing and flipping on hydration.
  useEffect(() => setMounted(true), []);

  const lightsOn = mounted ? resolvedTheme !== "dark" : false;

  const ray = cn(
    "transition-opacity duration-500 motion-reduce:transition-none",
    lightsOn ? "opacity-100" : "opacity-0"
  );

  return (
    <button
      type="button"
      role="switch"
      aria-checked={lightsOn}
      aria-label={lightsOn ? "Turn the lights off" : "Turn the lights on"}
      title={lightsOn ? "Lights on" : "Lights off"}
      onClick={() => setTheme(lightsOn ? "dark" : "light")}
      className={cn(
        "group grid size-10 shrink-0 place-items-center rounded-lg transition-colors",
        "hover:bg-foreground/5 dark:hover:bg-white/10",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn(
          "size-5 transition-[color,filter] duration-500 motion-reduce:transition-none",
          lightsOn
            ? "text-brand [filter:drop-shadow(0_1px_5px_oklch(0.76_0.15_75/0.55))]"
            : "text-muted-foreground group-hover:text-foreground"
        )}
      >
        {/* Flex — the drop from the ceiling */}
        <path d="M12 2.5v4.2" />

        {/* Shade. Filled when lit so the lamp reads as switched on rather than
            merely re-coloured; the fill stays under the stroke either way. */}
        <path
          d="M5.6 14.4C5.6 10.1 8.5 6.9 12 6.9s6.4 3.2 6.4 7.5Z"
          className={cn(
            "transition-[fill] duration-500 motion-reduce:transition-none",
            lightsOn ? "fill-brand/25" : "fill-transparent"
          )}
        />

        {/*
         * Cast light. The rays come up centre-outward rather than as one
         * group, which reads as the lamp warming rather than a state flag
         * flipping. 60ms apart is enough to feel sequential without anyone
         * consciously noticing a delay.
         */}
        <path d="M12 17.7v2.1" className={cn(ray, lightsOn && "delay-[90ms]")} />
        <path
          d="M8.7 17.4 7.9 19.4"
          className={cn(ray, lightsOn && "delay-[150ms]")}
        />
        <path
          d="M15.3 17.4l.8 2"
          className={cn(ray, lightsOn && "delay-[150ms]")}
        />
      </svg>
    </button>
  );
}
