import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

/**
 * The brand mark, everywhere.
 *
 * Replaced seven hand-rolled monogram tiles that had drifted apart. Swap the
 * artwork in `lib/brand.ts` and every surface updates: header, footer, admin
 * sidebar, admin sign-in and the 404.
 *
 * Two notes on the artwork:
 *
 * - The supplied "header" logo is a *stacked* lockup — mark over wordmark over
 *   a "design · build · inspire" tagline. In a 64px header the tagline lands
 *   around 4px tall and is unreadable, so the header pairs the standalone mark
 *   with a text wordmark instead. Use {@link Lockup} where there's real
 *   vertical room.
 * - There is no SVG, so nothing here recolours. The mark is gold on
 *   transparent, which carries on both the ivory site and dark surfaces.
 *
 * `app/icon.png` and `app/apple-icon.png` are separate files picked up by
 * Next's metadata conventions; `app/opengraph-image.tsx` renders through
 * next/og and reads `BRAND` directly.
 */
type Size = "sm" | "md" | "lg";
type Tone = "default" | "onHero";
type Wordmark = "none" | "display" | "plain";

/** Mark heights. Width follows the artwork's 391×305 aspect. */
const MARK_HEIGHT: Record<Size, number> = { sm: 26, md: 34, lg: 46 };

const WORDMARK: Record<Exclude<Wordmark, "none">, string> = {
  display: "text-lg tracking-tight",
  plain: "font-semibold tracking-tight",
};

const TONE: Record<Tone, string> = {
  default: "text-foreground",
  /** Over the hero, which follows the light switch — so this must too. */
  onHero: "text-foreground dark:text-white",
};

/**
 * The display face is applied inline rather than via `font-display`, because
 * that class is scoped to `.site-theme` — so the admin surfaces, which sit
 * outside it, would silently fall back to sans.
 *
 * The variable chain does double duty. `--theme-font-display` is only defined
 * inside `.site-theme` (the theme block is scoped to it), so on the public site
 * the wordmark follows the published theme, while on the admin surfaces the
 * variable is unset and it falls through to Fraunces. That is the intended
 * split — the theme dresses the site, never the dashboard used to fix it.
 */
const DISPLAY_STYLE = {
  fontFamily: "var(--theme-font-display, var(--font-fraunces), Georgia, serif)",
  fontWeight: 560,
} as const;

export function Logo({
  size = "md",
  tone = "default",
  wordmark = "display",
  /** Appended after the name, e.g. "Admin". */
  suffix,
  /** Renders as a link when set. */
  href,
  /** Set on the header instance — it's above the fold on every page. */
  priority = false,
  className,
}: {
  size?: Size;
  tone?: Tone;
  wordmark?: Wordmark;
  suffix?: string;
  href?: string;
  priority?: boolean;
  className?: string;
}) {
  const height = MARK_HEIGHT[size];
  const width = Math.round((BRAND.mark.width / BRAND.mark.height) * height);
  const label = suffix ? `${BRAND.name} ${suffix}` : BRAND.name;

  const content = (
    <>
      <Image
        src={BRAND.mark.src}
        alt=""
        aria-hidden
        width={width}
        height={height}
        priority={priority}
        className="w-auto shrink-0 transition-transform duration-300 ease-[var(--ease-spring)] group-hover:scale-105"
        style={{ height }}
      />
      {wordmark !== "none" && (
        <span
          className={cn(WORDMARK[wordmark], TONE[tone])}
          style={wordmark === "display" ? DISPLAY_STYLE : undefined}
        >
          {label}
        </span>
      )}
    </>
  );

  const classes = cn("group flex items-center gap-2.5", className);

  // The image is decorative, so when there's no wordmark the accessible name
  // has to come from the wrapper — otherwise this is an empty link.
  const accessibleName = wordmark === "none" ? label : undefined;

  return href ? (
    <Link href={href} className={classes} aria-label={accessibleName}>
      {content}
    </Link>
  ) : (
    <span
      className={classes}
      aria-label={accessibleName}
      role={accessibleName ? "img" : undefined}
    >
      {content}
    </span>
  );
}

/**
 * The full stacked lockup, including the tagline. Only for surfaces with
 * vertical room to spare — the 404 and the admin sign-in card. Anywhere
 * shorter than about 90px should use {@link Logo}.
 */
export function Lockup({
  height = 96,
  className,
}: {
  height?: number;
  className?: string;
}) {
  const width = Math.round((BRAND.lockup.width / BRAND.lockup.height) * height);
  return (
    <Image
      src={BRAND.lockup.src}
      alt={BRAND.name}
      width={width}
      height={height}
      className={cn("w-auto", className)}
      style={{ height }}
    />
  );
}
