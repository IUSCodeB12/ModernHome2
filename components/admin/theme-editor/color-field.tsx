"use client";

import { useEffect, useId, useState } from "react";
import { Check, Pipette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { checkContrast, type ContrastCheck } from "@/lib/theme/contrast";
import { hexToOklch, oklchToHex, type Oklch } from "@/lib/theme/oklch";

/** Chrome and Edge only; Safari and Firefox get the field without it. */
type EyeDropperCtor = new () => { open: () => Promise<{ sRGBHex: string }> };

const GRADE_STYLES: Record<ContrastCheck["grade"], string> = {
  AAA: "bg-emerald-100 text-emerald-900 border-emerald-200",
  AA: "bg-emerald-100 text-emerald-900 border-emerald-200",
  "AA Large": "bg-amber-100 text-amber-900 border-amber-200",
  Fail: "bg-red-100 text-red-900 border-red-200",
};

export function ColorField({
  label,
  hint,
  value,
  onChange,
  /** When set, shows a live contrast badge of `value` against this colour. */
  against,
  againstLabel,
}: {
  label: string;
  hint?: string;
  value: Oklch;
  onChange: (next: Oklch) => void;
  against?: Oklch;
  againstLabel?: string;
}) {
  const id = useId();
  const hex = oklchToHex(value);

  /*
   * The text field keeps its own draft while focused. Round-tripping every
   * keystroke through OKLCH and back would rewrite the input under the cursor —
   * type "#1" and normalisation turns it into "#110011" before the second
   * character lands. `null` means "not being edited, mirror the real value".
   */
  const [typed, setTyped] = useState<string | null>(null);
  const [hasEyeDropper, setHasEyeDropper] = useState(false);

  useEffect(() => {
    setHasEyeDropper(typeof window !== "undefined" && "EyeDropper" in window);
  }, []);

  function commitHex(next: string) {
    const parsed = hexToOklch(next);
    if (parsed) onChange(parsed);
    setTyped(null);
  }

  async function pickFromScreen() {
    const Ctor = (window as unknown as { EyeDropper?: EyeDropperCtor })
      .EyeDropper;
    if (!Ctor) return;
    try {
      const { sRGBHex } = await new Ctor().open();
      const parsed = hexToOklch(sRGBHex);
      if (parsed) onChange(parsed);
    } catch {
      // The user dismissed the picker. Nothing to report.
    }
  }

  const contrast = against ? checkContrast(value, against) : null;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        {contrast && (
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[0.7rem] font-medium tabular-nums",
              GRADE_STYLES[contrast.grade]
            )}
            title={`${contrast.ratio.toFixed(2)}:1 against ${againstLabel ?? "the background"}`}
          >
            {contrast.ratio.toFixed(2)}:1 {contrast.grade}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/*
         * The native input is the swatch: it carries the OS colour picker (and
         * its own eyedropper on macOS) without shipping a picker component, and
         * it is keyboard-reachable for free. Sized up so it reads as a swatch
         * rather than a form control.
         */}
        <input
          id={id}
          type="color"
          value={hex}
          onChange={(e) => commitHex(e.target.value)}
          aria-label={`${label} colour`}
          className="size-9 shrink-0 cursor-pointer rounded-md border bg-transparent p-0.5 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded [&::-webkit-color-swatch]:border-0"
        />
        <Input
          value={typed ?? hex}
          onChange={(e) => setTyped(e.target.value)}
          onBlur={(e) => commitHex(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitHex(e.currentTarget.value);
            if (e.key === "Escape") setTyped(null);
          }}
          spellCheck={false}
          aria-label={`${label} hex value`}
          className="h-9 font-mono text-sm uppercase"
        />
        {hasEyeDropper && (
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={pickFromScreen}
            title="Pick a colour from anywhere on screen"
          >
            <Pipette />
            <span className="sr-only">Pick {label} from screen</span>
          </Button>
        )}
      </div>

      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}

      {/*
       * The fix is offered, never applied silently — this is the admin's own
       * colour, and quietly replacing it would publish something they did not
       * choose. Everything *derived* from it is solved for AA automatically.
       */}
      {contrast?.suggestion && (
        <button
          type="button"
          onClick={() => onChange(contrast.suggestion!)}
          className="flex w-full items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-left text-xs text-amber-900 transition-colors hover:bg-amber-100"
        >
          <Check className="size-3.5 shrink-0" />
          <span>
            Too low against {againstLabel ?? "the background"}. Use the nearest
            passing shade
          </span>
          <span
            aria-hidden
            className="ml-auto size-4 shrink-0 rounded border border-black/10"
            style={{ background: oklchToHex(contrast.suggestion) }}
          />
        </button>
      )}
    </div>
  );
}
