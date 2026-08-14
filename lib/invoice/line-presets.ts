import { CUSTOM_SERVICE_SLUG } from "@/lib/services/custom";

/**
 * The quoting catalogue: ready-made line items and per-service starter
 * breakdowns for the price builder.
 *
 * Every figure is **GST-inclusive**, because `calcInvoiceTotals` treats line
 * totals as inclusive and backs the 1/11th GST component out of them — the
 * standard way an Australian consumer quote is presented. A price entered here
 * is the number the customer sees.
 *
 * These are starting points, not fixed rates. The admin edits every figure in
 * the builder before sending, and nothing here is ever written to the database
 * except as an ordinary line item.
 */

export type PresetLine = {
  description: string;
  quantity: number;
  unit_price_cents: number;
  /** What the quantity counts, shown in the picker (e.g. "per hour"). */
  unit?: string;
};

export type PresetGroupId =
  | "labour"
  | "materials"
  | "consumables"
  | "access"
  | "electrical"
  | "travel"
  | "makegood"
  | "adjustments";

export type PresetGroup = {
  id: PresetGroupId;
  label: string;
  blurb: string;
  lines: PresetLine[];
};

/** Compact constructor — dollars in, cents out. */
function l(
  description: string,
  dollars: number,
  quantity = 1,
  unit?: string
): PresetLine {
  return {
    description,
    quantity,
    unit_price_cents: Math.round(dollars * 100),
    unit,
  };
}

export const LINE_CATALOGUE: PresetGroup[] = [
  {
    id: "labour",
    label: "Labour",
    blurb: "On-site time. Quantity is hours unless the line says otherwise.",
    lines: [
      l("Installation labour", 110, 1, "per hour"),
      l("Second installer (two-person lift)", 85, 1, "per hour"),
      l("Minimum call-out", 99),
      l("After-hours / weekend surcharge", 55),
    ],
  },
  {
    id: "materials",
    label: "Materials",
    blurb: "Parts supplied and left on site.",
    lines: [
      l("TV wall bracket — fixed", 89),
      l("TV wall bracket — tilt", 119),
      l("TV wall bracket — full motion", 199),
      l("In-wall cable concealment kit", 120),
      l("Cable conduit / trunking", 18, 1, "per metre"),
      l("LED strip — supplied", 22, 1, "per metre"),
      l("LED driver / transformer", 75),
      l("Dimmer / controller", 95),
      l("Aluminium channel + diffuser", 28, 1, "per metre"),
      l("Cabinet panel material", 180, 1, "per metre"),
      l("Glass shelf", 85, 1, "each"),
      l("Soft-close hinge", 18, 1, "each"),
      l("Heater mounting kit", 45),
    ],
  },
  {
    id: "consumables",
    label: "Consumables",
    blurb: "Used up on the job — fixings, adhesives, bit wear.",
    lines: [
      l("Fixings & sundries", 25),
      l("Masonry / concrete anchor set", 35),
      l("Diamond core bit wear (masonry)", 45),
      l("Silicone / construction adhesive", 18),
      l("Patching compound & touch-up", 30),
    ],
  },
  {
    id: "access",
    label: "Access & equipment",
    blurb: "Anything beyond a standard step-ladder reach.",
    lines: [
      l("High-level access (ceilings over 3m)", 85),
      l("Scaffold / trestle hire", 180, 1, "per day"),
      l("Core drilling through masonry", 120),
    ],
  },
  {
    id: "electrical",
    label: "Electrical",
    blurb: "Licensed work — heaters, new outlets, hard-wired lighting.",
    lines: [
      l("Licensed electrician attendance", 180),
      l("New power point (GPO) installed", 220),
      l("Isolation switch installed", 140),
      l("Hard-wire LED driver to circuit", 160),
    ],
  },
  {
    id: "travel",
    label: "Travel",
    blurb: "Metro is normally absorbed; charge distance only when it's real.",
    lines: [
      l("Travel — outer metro", 45),
      l("Travel beyond 30km", 1.6, 1, "per km"),
      l("Parking / tolls", 20),
    ],
  },
  {
    id: "makegood",
    label: "Make-good & extras",
    blurb: "Leaving the room the way the customer wants it.",
    lines: [
      l("Wall patch & paint touch-up", 95),
      l("Remove & dispose of old unit", 60),
      l("Rubbish removal", 50),
      l("Furniture moving / room prep", 45),
    ],
  },
  {
    id: "adjustments",
    label: "Adjustments",
    blurb: "Negative lines. The quote total still has to land above zero.",
    lines: [
      l("Discount", -50),
      l("Multi-job discount", -100),
      l("Goodwill adjustment", -25),
    ],
  },
];

/**
 * Starter breakdowns per service. Loading one replaces the builder's lines, so
 * a typical job starts three edits from done rather than from a blank table.
 */
export const SERVICE_TEMPLATES: Record<string, PresetLine[]> = {
  "tv-wall-mounting": [
    l("Installation labour", 110, 1.5, "per hour"),
    l("TV wall bracket — tilt", 119),
    l("Fixings & sundries", 25),
  ],
  "tv-floating-cabinet": [
    l("Installation labour", 110, 4, "per hour"),
    l("Cabinet panel material", 180, 1.8, "per metre"),
    l("Soft-close hinge", 18, 2, "each"),
    l("Fixings & sundries", 25),
  ],
  "showcase-cabinet": [
    l("Installation labour", 110, 6, "per hour"),
    l("Cabinet panel material", 180, 2, "per metre"),
    l("Glass shelf", 85, 3, "each"),
    l("Fixings & sundries", 25),
  ],
  "led-strip-lighting": [
    l("Installation labour", 110, 2, "per hour"),
    l("LED strip — supplied", 22, 5, "per metre"),
    l("Aluminium channel + diffuser", 28, 5, "per metre"),
    l("LED driver / transformer", 75),
    l("Fixings & sundries", 25),
  ],
  "room-heater-installation": [
    l("Installation labour", 110, 2, "per hour"),
    l("Heater mounting kit", 45),
    l("Licensed electrician attendance", 180),
    l("Fixings & sundries", 25),
  ],
  [CUSTOM_SERVICE_SLUG]: [
    l("Installation labour", 110, 2, "per hour"),
    l("Materials allowance", 150),
    l("Fixings & sundries", 25),
  ],
};

export function templateForService(slug: string | null | undefined): PresetLine[] {
  return slug ? (SERVICE_TEMPLATES[slug] ?? []) : [];
}
