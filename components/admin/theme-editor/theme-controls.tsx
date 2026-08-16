"use client";

import { ChevronRight, TriangleAlert } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ColorField } from "@/components/admin/theme-editor/color-field";
import { deriveDark } from "@/lib/theme/derive";
import { BODY_FONT_IDS, DISPLAY_FONT_IDS, FONTS, type FontId } from "@/lib/theme/fonts";
import type { Oklch } from "@/lib/theme/oklch";
import type {
  DerivedPalette,
  ThemeInput,
  ThemeMode,
  ThemePalette,
} from "@/lib/theme/tokens";

/**
 * Hue of the AS55 mark, which is a fixed-hue PNG and cannot be recoloured.
 * `--brand` was retuned to this once already, to stop a saturated orange
 * clashing with the logo everywhere the two appeared together.
 */
const LOGO_HUE = 82;
const LOGO_HUE_TOLERANCE = 45;

/** Shortest distance around the colour wheel, 0–180. */
function hueDistance(a: number, b: number): number {
  const raw = Math.abs(((a - b) % 360 + 360) % 360);
  return raw > 180 ? 360 - raw : raw;
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 border-t border-border pt-5 first:border-t-0 first:pt-0">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function FontSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: FontId;
  options: FontId[];
  onChange: (id: FontId) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      <Select value={value} onValueChange={(v) => onChange(v as FontId)}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((id) => (
            <SelectItem key={id} value={id}>
              <span className="flex flex-col items-start">
                <span>{FONTS[id].label}</span>
                <span className="text-xs text-muted-foreground">
                  {FONTS[id].note}
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function PaletteFields({
  palette,
  derived,
  onChange,
}: {
  palette: ThemePalette;
  derived: DerivedPalette;
  onChange: (key: keyof ThemePalette, value: Oklch) => void;
}) {
  return (
    <>
      <ColorField
        label="Brand accent"
        hint="CTAs, highlights, focus rings. Hover and pressed states are generated."
        value={palette.brand}
        onChange={(v) => onChange("brand", v)}
      />
      <ColorField
        label="Primary button"
        hint="The solid button fill. Its label colour is chosen for you."
        value={palette.primary}
        onChange={(v) => onChange("primary", v)}
      />
      <ColorField
        label="Page background"
        hint="Cards, panels, muted surfaces and borders all step off this."
        value={palette.background}
        onChange={(v) => onChange("background", v)}
      />
      {/*
       * Checked against `accent`, the furthest surface from the page ground —
       * text sits on it at the lowest ratio anywhere on the site. Checking the
       * background alone would pass text that then fails on every muted panel.
       */}
      <ColorField
        label="Body text"
        hint="Secondary text is derived from this and kept at AA automatically."
        value={palette.foreground}
        onChange={(v) => onChange("foreground", v)}
        against={derived.accent}
        againstLabel="muted panels"
      />
    </>
  );
}

export function ThemeControls({
  tokens,
  derived,
  onPatch,
}: {
  tokens: ThemeInput;
  derived: { light: DerivedPalette; dark: DerivedPalette };
  onPatch: (changes: Partial<ThemeInput>) => void;
}) {
  const brandClashesWithLogo =
    hueDistance(tokens.light.brand.h, LOGO_HUE) > LOGO_HUE_TOLERANCE;

  function patchPalette(mode: "light" | "dark") {
    return (key: keyof ThemePalette, value: Oklch) => {
      if (mode === "light") {
        onPatch({ light: { ...tokens.light, [key]: value } });
      } else {
        const base = tokens.dark ?? deriveDark(tokens.light);
        onPatch({ dark: { ...base, [key]: value } });
      }
    };
  }

  return (
    <div className="space-y-6">
      <Section
        title="Colours"
        description="Pick four. Every other shade, hover state and text pairing is generated from them."
      >
        <PaletteFields
          palette={tokens.light}
          derived={derived.light}
          onChange={patchPalette("light")}
        />

        {brandClashesWithLogo && (
          <p className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs text-amber-900">
            <TriangleAlert className="mt-px size-3.5 shrink-0" />
            <span>
              The AS55 logo is a fixed champagne-gold image and can&apos;t be
              recoloured, so this accent will read as a clash next to it. Worth
              pairing with a new logo.
            </span>
          </p>
        )}
      </Section>

      <Section title="Type" description="Two faces, from a list that ships with the site.">
        <FontSelect
          label="Headlines"
          value={tokens.fonts.display}
          options={DISPLAY_FONT_IDS}
          onChange={(display) => onPatch({ fonts: { ...tokens.fonts, display } })}
        />
        <FontSelect
          label="Body text"
          value={tokens.fonts.body}
          options={BODY_FONT_IDS}
          onChange={(body) => onPatch({ fonts: { ...tokens.fonts, body } })}
        />
      </Section>

      <Section title="Shape" description="Corner rounding, everywhere at once.">
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <Label htmlFor="radius" className="text-sm font-medium">
              Corner radius
            </Label>
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {tokens.radius.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")}rem
            </span>
          </div>
          <input
            id="radius"
            type="range"
            min={0}
            max={1.5}
            step={0.125}
            value={tokens.radius}
            onChange={(e) => onPatch({ radius: Number(e.target.value) })}
            className="w-full accent-foreground"
          />
          <div className="flex justify-between text-[0.7rem] text-muted-foreground">
            <span>Square</span>
            <span>Soft</span>
            <span>Pill</span>
          </div>
        </div>
      </Section>

      {/*
       * Native <details>: the disclosure is free, keyboard-accessible and works
       * before hydration. Everything in here is either rarely touched or a
       * deliberate override of something the system already handles well.
       */}
      <details className="group border-t border-border pt-5">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-semibold [&::-webkit-details-marker]:hidden">
          <ChevronRight className="size-4 transition-transform duration-200 group-open:rotate-90" />
          Advanced
        </summary>

        <div className="mt-4 space-y-6 pl-1">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Default appearance</Label>
            <Select
              value={tokens.defaultMode}
              onValueChange={(v) => onPatch({ defaultMode: v as ThemeMode })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">Match the visitor&apos;s device</SelectItem>
                <SelectItem value="light">Always start light</SelectItem>
                <SelectItem value="dark">Always start dark</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Only what a first-time visitor sees. Anyone who uses the
              light/dark switch keeps their own choice.
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Dark mode colours</Label>
              <Select
                value={tokens.dark ? "custom" : "auto"}
                onValueChange={(v) =>
                  onPatch({ dark: v === "auto" ? null : deriveDark(tokens.light) })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Generate from light mode</SelectItem>
                  <SelectItem value="custom">Choose separately</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Generating keeps your hues, so dark mode still looks like the
                same brand. Only override it if you&apos;re designing dark-first.
              </p>
            </div>

            {tokens.dark && (
              <div className="space-y-4 rounded-lg border border-border bg-muted/40 p-3">
                <PaletteFields
                  palette={tokens.dark}
                  derived={derived.dark}
                  onChange={patchPalette("dark")}
                />
              </div>
            )}
          </div>
        </div>
      </details>
    </div>
  );
}
