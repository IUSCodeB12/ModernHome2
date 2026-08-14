"use client";

import { useState } from "react";
import { LINE_CATALOGUE, type PresetLine } from "@/lib/invoice/line-presets";
import { formatAud } from "@/lib/quote/estimate";
import { cn } from "@/lib/utils";

/**
 * Grouped picker over the quoting catalogue. Clicking a preset appends it as
 * an ordinary editable line — nothing here is locked once it lands in the
 * table.
 */
export function CataloguePicker({ onAdd }: { onAdd: (line: PresetLine) => void }) {
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const group = LINE_CATALOGUE.find((g) => g.id === openGroup);

  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs font-medium text-muted-foreground">
        Add from catalogue
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {LINE_CATALOGUE.map((g) => (
          <button
            key={g.id}
            type="button"
            aria-pressed={openGroup === g.id}
            onClick={() => setOpenGroup(openGroup === g.id ? null : g.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              openGroup === g.id
                ? "border-brand bg-brand text-brand-foreground"
                : "border-border hover:border-brand/40 hover:bg-accent/40"
            )}
          >
            {g.label}
          </button>
        ))}
      </div>

      {group && (
        <div className="mt-3 space-y-1.5">
          <p className="text-xs text-muted-foreground">{group.blurb}</p>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {group.lines.map((line) => (
              <button
                key={line.description}
                type="button"
                onClick={() => onAdd(line)}
                className="flex items-center justify-between gap-2 rounded-md border border-border px-2.5 py-1.5 text-left text-xs transition-colors hover:border-brand/40 hover:bg-accent/40"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    {line.description}
                  </span>
                  {line.unit && (
                    <span className="text-muted-foreground">{line.unit}</span>
                  )}
                </span>
                <span
                  className={cn(
                    "shrink-0 tabular-nums",
                    line.unit_price_cents < 0
                      ? "text-destructive"
                      : "text-muted-foreground"
                  )}
                >
                  {formatAud(line.unit_price_cents)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
