"use client";

import { deriveTheme } from "@/lib/theme/derive";
import { oklchToHex } from "@/lib/theme/oklch";
import { THEME_PRESETS, type ThemePreset } from "@/lib/theme/presets";
import type { ThemeInput } from "@/lib/theme/tokens";
import { cn } from "@/lib/utils";

/**
 * The one-click path. Each card previews the preset by deriving it for real
 * rather than listing its four authored colours — so the swatches show the
 * surfaces and text the theme will actually produce, including the solved
 * foregrounds. What you see on the card is what the site gets.
 */
function swatches(preset: ThemePreset): string[] {
  const { light, dark } = deriveTheme(preset.tokens);
  const palette = preset.tokens.defaultMode === "dark" ? dark : light;
  return [
    palette.background,
    palette.card,
    palette.brand,
    palette.primary,
    palette.foreground,
  ].map(oklchToHex);
}

export function PresetGrid({
  active,
  onPick,
}: {
  /** Preset id whose colours the current draft still matches, if any. */
  active: string | null;
  onPick: (tokens: ThemeInput) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {THEME_PRESETS.map((preset) => (
        <button
          key={preset.id}
          type="button"
          onClick={() => onPick(preset.tokens)}
          aria-pressed={active === preset.id}
          className={cn(
            "group rounded-xl border p-3 text-left transition-all duration-200 ease-[var(--ease-out-soft)] hover:border-foreground/25 hover:shadow-sm",
            active === preset.id
              ? "border-foreground/40 bg-accent/40 ring-1 ring-foreground/10"
              : "border-border"
          )}
        >
          <div className="flex gap-1">
            {swatches(preset).map((hex, i) => (
              <span
                key={i}
                aria-hidden
                className="h-6 flex-1 rounded first:rounded-l-md last:rounded-r-md"
                style={{ background: hex, boxShadow: "inset 0 0 0 1px rgb(0 0 0 / 0.08)" }}
              />
            ))}
          </div>
          <p className="mt-2 text-sm font-medium">{preset.name}</p>
          <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
            {preset.description}
          </p>
        </button>
      ))}
    </div>
  );
}
