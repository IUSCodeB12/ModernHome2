import type { BookingStatus } from "@/lib/bookings/status";

/**
 * What each stage of the job looks like.
 *
 * The portal used to render one layout in one colour for all nine statuses, so
 * a finished job you'd already paid for was pixel-identical to one still being
 * priced. Stage is the page's whole subject — it should be legible from across
 * the room, before any text is read.
 *
 * Four families rather than nine bespoke skins: the customer only needs to tell
 * apart "nothing to do", "over to you", "done" and "closed". Keyed by status
 * rather than by `Journey.tone` because `booked` and `enquiry` share a tone but
 * not a mood — one is a date in the diary, the other is a wait.
 */
export type StageAccent = "neutral" | "brand" | "emerald" | "muted";

const ACCENT_BY_STATUS: Record<BookingStatus, StageAccent> = {
  enquiry: "neutral",
  quoted: "brand",
  approved: "neutral",
  // The visit is on the books — warm it up, this is the good news.
  booked: "brand",
  in_progress: "brand",
  completed: "emerald",
  invoiced: "brand",
  paid: "emerald",
  cancelled: "muted",
};

export type StageStyle = {
  /** Hero ground. A wash with a light source top-left, never a solid fill. */
  surface: string;
  /** Accent text — numerals, icons, the small caps caption. */
  text: string;
  /** Quiet fill for status dots — reads at 6px against a card. */
  fill: string;
  /**
   * The confident solid accent, for objects that carry weight on their own:
   * the rail's active node, the stamp. Distinct from `fill` because a neutral
   * stage still wants a quiet dot but a *visible* "you are here".
   */
  strong: string;
  /** Hairline that picks up the accent. */
  hairline: string;
};

/**
 * Every colour is stated as an alpha over the page ground rather than a fixed
 * light/dark pair, so one string works in both themes — `--brand` and
 * `--foreground` already flip themselves. Emerald is the exception: it's a raw
 * Tailwind hue with no theme token behind it, so it names both.
 */
export const STAGE_STYLES: Record<StageAccent, StageStyle> = {
  neutral: {
    surface: "bg-card border-border",
    text: "text-muted-foreground",
    fill: "bg-muted-foreground/40",
    strong: "bg-brand",
    hairline: "border-border",
  },
  brand: {
    surface:
      "bg-gradient-to-br from-brand/[0.14] via-card to-card border-brand/25",
    text: "text-foreground",
    fill: "bg-brand",
    strong: "bg-brand",
    hairline: "border-brand/25",
  },
  emerald: {
    surface:
      "bg-gradient-to-br from-emerald-500/[0.12] via-card to-card border-emerald-600/25",
    text: "text-emerald-700 dark:text-emerald-500",
    fill: "bg-emerald-600 dark:bg-emerald-500",
    strong: "bg-emerald-600 dark:bg-emerald-500",
    hairline: "border-emerald-600/25",
  },
  muted: {
    surface: "bg-muted/40 border-border",
    text: "text-muted-foreground",
    fill: "bg-muted-foreground/30",
    strong: "bg-muted-foreground/50",
    hairline: "border-border",
  },
};

export function stageAccent(status: BookingStatus): StageAccent {
  return ACCENT_BY_STATUS[status];
}

export function stageStyle(status: BookingStatus): StageStyle {
  return STAGE_STYLES[stageAccent(status)];
}
