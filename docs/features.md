# Features

Each feature lists its routes, UI, and logic so you can load only what you need.

## Home / marketing
- **Routes:** `app/(site)/page.tsx`, `app/(site)/layout.tsx`
- **UI:** `components/home/*`, `components/three/*` (3D room + scroll tour),
  `components/site/*` (header, footer, mobile menu, floating CTA)
- **Logic:** `lib/home/data.ts`, `lib/three/*`, `hooks/use-scene-mode.ts`
- **Notes:** long editorial homepage; 3D is perf-gated with a static fallback.

## Services
- **Routes:** `app/(site)/services/page.tsx`, `app/(site)/services/[slug]/page.tsx`
- **UI:** `components/services/estimate-preview.tsx`, `components/ar/*`
- **Logic:** `lib/services/data.ts`, `lib/quote/estimate.ts`
- **Notes:** each service can carry an AR model (glb/usdz) shown via `model-viewer`.

## Quote & book (core flow)
- **Routes:** `app/(site)/quote/page.tsx` (+ `actions.ts`)
- **UI:** `components/quote/wizard.tsx`, `components/quote/step-*.tsx`
- **Logic:** `lib/quote/{types,wizard-state,answers,estimate,image,demo-data}.ts`,
  `lib/slots.ts`
- **Flow:** pick service → answer questions → photos → contact/OTP → choose a
  Melbourne-timezone 2-hour slot → review. RHF+zod, persisted to `sessionStorage`. The slot
  engine excludes busy bookings (read via the service-role client) and blocked dates.

## Portal (customer)
- **Routes:** `app/(site)/portal/page.tsx`, `app/(site)/portal/[id]/page.tsx`, `/bookings`
- **Logic:** reads quotes/bookings via the cookie server client (RLS scopes to the user);
  formats money with `lib/quote/estimate.ts` (`formatAud`) and times with `date-fns-tz`.
- **Notes:** `noindex`. Requires sign-in (redirects to `/login?next=/portal`).

## Gallery
- **Routes:** `app/(site)/gallery/page.tsx`
- **UI:** `components/gallery/*` (filterable grid + draggable before/after slider)
- **Logic:** `lib/gallery/data.ts`

## Auth
- **Routes:** `app/(site)/login`, `app/(admin)/admin/login`, `app/auth/confirm`, `app/auth/error`
- **UI:** `components/auth/*` (auth-card, otp-input, resend-timer, google-button),
  `components/site/user-menu.tsx`
- **Logic:** `lib/auth/roles.ts` (`isAdmin`), `lib/auth/redirect.ts` (`safeNext`),
  `lib/supabase/{server,client,middleware}.ts`
- **Notes:** passwordless 6-digit email OTP; Google OAuth planned; admin MFA planned.

## Admin dashboard
- **Routes:** `app/(admin)/admin/(dashboard)/*` — dashboard, bookings, quotes(+`[id]`),
  calendar, services, gallery, invoices, customers, settings (+ per-view `actions.ts`)
- **UI:** `components/admin/*` (views, editors, quote actions, availability manager,
  gallery/bookings managers)
- **Logic:** `lib/admin/*-data.ts` (loaders), `lib/admin/guard.ts` (route auth),
  `lib/bookings/status.ts`, `lib/invoice/calc.ts`, `lib/admin/demo.ts`
- **Notes:** `noindex`; Realtime updates; drag-drop booking pipeline; service-role writes.

## Cross-cutting
- **Supabase clients** — `lib/supabase/*` (see CLAUDE.md for which to use).
- **Email** — `lib/email/send.ts` (stub; deferred).
- **Types** — `lib/database.types.ts` (generated), `types/model-viewer.d.ts`.
- **SEO** — `app/robots.ts`, `app/sitemap.ts` (includes service slugs), `app/icon.tsx`,
  `app/opengraph-image.tsx`, per-page metadata, `not-found.tsx`.
