# CLAUDE.md

Concise guide for AI assistants working in this repo. See `docs/` for depth.

## Project

**ModernHome** — a premium quote-and-book platform for an Australian home-improvement
tradie (TV mounting, floating/showcase cabinets, LED strip lighting, room heaters).
Customers get an instant fixed-price quote via a wizard, pick a 2-hour arrival window,
and manage jobs in a portal. Admins run quotes/bookings/calendar/services/gallery from
a dashboard. Live at `modern-home2.vercel.app`.

## Tech stack

- **Next.js 15.5** App Router, **React 19**, **TypeScript (strict)**
- **Tailwind v4** (`@theme inline`, oklch tokens in `app/globals.css`) + **shadcn/ui**
- **Supabase** — Postgres + RLS, Auth (passwordless email OTP), Storage, Realtime; SSR
  sessions via `@supabase/ssr` cookies. Hand-written types in `lib/database.types.ts`.
- **React Three Fiber** + drei for the 3D room; `@google/model-viewer` for AR
- **framer-motion**, **react-hook-form + zod**, **date-fns / date-fns-tz** (Australia/Melbourne)
- **Vitest** for logic tests. **pnpm** (on PATH via `~/.npm-global/bin`). Deployed on Vercel.

## Layout

```
app/        Next.js routes only — (site) public group, (admin) dashboard group, auth/
components/ UI grouped by area: ui/ (shadcn) + admin/ auth/ gallery/ home/ quote/ services/ site/ three/ ar/
lib/        Non-UI logic grouped by domain: supabase/ quote/ admin/ auth/ three/ + slots, invoice, bookings, email
hooks/      Shared React hooks (useX)
supabase/   SQL migrations + email templates
docs/       Architecture, structure, feature docs
```

Pages live in `app/` (App Router requirement); each feature's components live under
`components/<feature>/`, its logic/data under `lib/<feature>/`.

## Conventions

- **Filenames: kebab-case** for everything (`service-editor.tsx`, `home/data.ts`). This is
  deliberate — Vercel's Linux build is case-sensitive, so we avoid casing drift. Do NOT
  rename files to PascalCase.
- **In code:** components `PascalCase`, hooks `useSomething`, utils/functions `camelCase`,
  types/interfaces `PascalCase`.
- **Imports:** always the `@/*` alias (maps to repo root — `baseUrl: "."`, no `src/`).
- **Data loaders:** one per feature at `lib/<feature>/data.ts` (or `*-data.ts` under
  `lib/admin/`). Server-only; they read Supabase and fall back to demo data when unconfigured.
- **Server actions:** colocated with their route as `app/**/actions.ts` (`"use server"`).
- Keep files single-responsibility: components < 300, pages < 500, hooks < 150, utils < 200
  lines. `lib/database.types.ts` is generated — never hand-edit or split it.

## Supabase clients (pick the right one)

- `lib/supabase/client.ts` — browser client (client components)
- `lib/supabase/server.ts` — cookie-bound server client (RLS as the signed-in user)
- `lib/supabase/admin.ts` — service-role client, **server-only**, bypasses RLS. Use only for
  cross-user reads (e.g. busy booking slots). Guarded by `isSupabaseConfigured()`.
- `lib/supabase/middleware.ts` — session refresh + admin-route protection

## Workflow

- Dev: `pnpm dev`. Typecheck: `pnpm exec tsc --noEmit`. Tests: `pnpm exec vitest run`.
- **Verify before shipping:** typecheck + tests + build. A live preview server is usually
  running — verify 3D/UI changes in the browser, don't ask the user to check manually.
- **Never run `pnpm build` while the dev server runs** — it corrupts `.next`
  (buildManifest ENOENT). Stop preview → build → `rm -rf .next` → restart.
- **Secrets stay out of git:** `.env.local`, `.mcp.json`, `.claude/` are gitignored; the
  repo is public. Never commit them.

## Key decisions

- **Auth is passwordless** (email 6-digit OTP; Google OAuth planned). Admin gated by a
  `profiles.role = 'admin'` check (`lib/auth/roles.ts` → `isAdmin`).
- **3D is perf-gated:** canvases mount only on intent / via IntersectionObserver, with a
  static poster fallback, to hold Lighthouse mobile ≥ 95.
- **Slot engine** (`lib/slots.ts`) computes availability in Australia/Melbourne from
  `availability_rules` − `blocked_dates` − busy bookings. Pure + unit-tested.
- **Estimate/invoice math** is pure and unit-tested (`lib/quote/estimate.ts`, `lib/invoice/calc.ts`).
- Stripe deposits and Resend transactional emails are **stubbed**, deferred to production.
