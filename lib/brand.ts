/**
 * Brand identity — everything a rebrand touches, in one place.
 *
 * Kept separate from `lib/business.ts`, which holds *legal* identity (ABN,
 * ACN, jurisdiction). Those change when the entity is registered; these change
 * when the brand does. `business.ts` reads its trading name from here so the
 * name is never written twice.
 *
 * Before this existed the name was hardcoded in 17 files and the monogram was
 * hand-rolled in 7, and `lib/seo/json-ld.ts` had grown a second, competing
 * business constant. Renaming meant a scavenger hunt.
 *
 * TO REBRAND:
 *   1. Edit the values below.
 *   2. Drop the new mark into `components/site/logo.tsx` (one component, all
 *      call sites).
 *   3. Change `--brand` and the palette in `app/globals.css` if the colours
 *      move.
 *
 * Outside this repo, the name also lives in: the Vercel project and domain,
 * the Supabase auth email templates (edited in their dashboard, not here),
 * `supabase/config.toml`, `supabase/email-templates/otp.html`, and the seed
 * data in `supabase/migrations`.
 */
export const BRAND = {
  /** Full name, exactly as it should be typeset. Capitalisation matters. */
  name: "AceStudio55",
  /**
   * Text fallback for the mark — used only where the image can't render.
   * Two or three characters; more won't fit at 32px.
   */
  monogram: "AS",
  /** One-line promise. Used in metadata, the OG image and the footer. */
  tagline: "Your home, done properly",
  /** Bare host, no protocol. `NEXT_PUBLIC_SITE_URL` overrides this at runtime. */
  domain: "acestudio55.com.au",
  /**
   * Transactional *sending* address. `EMAIL_FROM` overrides this at runtime.
   *
   * This is a Resend sender, not a mailbox — mail sent here only arrives if
   * inbound routing (Workspace/forwarding) is set up separately. That's why
   * `BUSINESS.email`, the address we *publish* to customers, is still null:
   * see the null-means-omit rule in `lib/business.ts`.
   */
  email: "bookings@acestudio55.com.au",

  /**
   * Artwork. All PNG with transparent backgrounds — there is no SVG, so these
   * can't be recoloured and shouldn't be displayed above their native size.
   *
   * `mark` is the AS55 monogram (391×305). `lockup` is the stacked
   * mark-over-wordmark-over-tagline (365×240) — it needs real vertical room,
   * so it is used on the 404 and auth screens, not in the 64px header.
   */
  mark: { src: "/brand/mark.png", width: 391, height: 305 },
  lockup: { src: "/brand/lockup.png", width: 365, height: 240 },
  lockupLarge: { src: "/brand/lockup-large.png", width: 735, height: 482 },
} as const;

/** Canonical site origin. Env wins so previews and production differ correctly. */
export const SITE_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL ?? `https://${BRAND.domain}`;
