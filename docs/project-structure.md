# Project structure

The repo is a single Next.js 15 App Router application. There is **no `src/` directory** —
the `@/*` import alias maps to the repo root (`tsconfig.json`: `baseUrl: "."`,
`paths: { "@/*": ["./*"] }`). Code is organised by **area/feature**, not by file type.

## Top-level

| Path | Purpose |
|------|---------|
| `app/` | Next.js routes **only** — pages, layouts, route handlers, server actions. Nothing reusable lives here. |
| `components/` | React components, grouped by area. `ui/` holds shadcn primitives; every other folder is a feature/surface. |
| `lib/` | Non-UI logic: data access, business rules, utilities, the Supabase clients. Grouped by domain. |
| `hooks/` | Shared React hooks. |
| `types/` | Ambient type declarations (e.g. `model-viewer.d.ts`). |
| `supabase/` | SQL migrations (`migrations/`) and auth email templates (`email-templates/`). |
| `scripts/` | One-off build/dev scripts (e.g. placeholder GLB generator). |
| `public/` | Static assets. |
| `docs/` | This documentation. |

## `app/` route groups

- `app/(site)/` — public customer site (shares the marketing header/footer layout):
  `/` (home), `/services`, `/services/[slug]`, `/gallery`, `/quote`, `/portal`,
  `/portal/[id]`, `/bookings`, `/login`.
- `app/(admin)/admin/` — staff dashboard. `(dashboard)/` is a layout group wrapping
  `/admin`, `/admin/bookings`, `/quotes` (+`/[id]`), `/calendar`, `/services`, `/gallery`,
  `/invoices`, `/customers`, `/settings`. `/admin/login` sits outside the dashboard layout.
- `app/auth/` — `confirm/route.ts` (OTP/magic-link verification handler) and `error/page.tsx`.
- Root-level metadata files: `layout.tsx`, `robots.ts`, `sitemap.ts`, `icon.tsx`,
  `opengraph-image.tsx`, `not-found.tsx`, `globals.css`.

**Server actions** are colocated with the route that uses them as `actions.ts`
(`"use server"`) — e.g. `app/(site)/quote/actions.ts`, `app/(admin)/.../quotes/actions.ts`.

## `components/` folders

| Folder | Contents |
|--------|----------|
| `ui/` | shadcn/ui primitives (button, select, dropdown-menu, sonner, …). |
| `home/` | Homepage sections (hero, before/after, recent jobs, woven canvas, …). |
| `three/` | R3F 3D room. `room.tsx` = public API (`Room`, `RoomGeometry`, `HOTSPOTS`); `room-parts.tsx` = geometry leaf components; plus `decor`, `hotspot`, `hero-scene`, `room-tour*`. |
| `quote/` | Quote wizard and its steps (`wizard.tsx`, `step-*.tsx`). |
| `services/` | Service-detail widgets (estimate preview). |
| `gallery/` | Gallery grid + before/after slider. |
| `admin/` | Dashboard views, editors, action UIs. |
| `auth/` | Reusable auth UI (auth-card, otp-input, resend-timer, google-button). |
| `site/` | Site chrome (header, mobile-menu, user-menu, floating-cta). |
| `ar/` | `model-viewer` AR wrapper. |

## `lib/` folders

| Folder / file | Contents |
|---------------|----------|
| `supabase/` | `client`, `server`, `admin`, `middleware` — see CLAUDE.md for which to use. |
| `quote/` | Wizard types/state, answer helpers, estimate math (+ tests), image helpers, demo data. |
| `services/data.ts` | Reads active services + questions (public site + sitemap). |
| `home/data.ts` | Homepage content loader. |
| `gallery/data.ts` | Public gallery loader. |
| `admin/` | Per-view data loaders (`*-data.ts`), `guard.ts` (route auth), `demo.ts`. |
| `auth/` | `roles.ts` (`isAdmin`), `redirect.ts` (`safeNext` open-redirect guard). |
| `three/` | Procedural marble/wood textures, camera-tour keyframes. |
| `slots.ts` | Availability/slot engine (+ `slots.test.ts`). |
| `invoice/calc.ts` | Invoice math (+ `calc.test.ts`). |
| `bookings/status.ts` | Booking status model/transitions. |
| `email/send.ts` | Email send (stub, deferred to production). |
| `database.types.ts` | **Generated** Supabase types — do not edit by hand. |
| `utils.ts` | `cn` and small shared helpers. |

## Naming

Files: **kebab-case** throughout (chosen for Vercel case-sensitivity safety). In code:
components/types `PascalCase`, hooks `useX`, functions/utils `camelCase`. Feature data
loaders are `lib/<feature>/data.ts` (or `lib/admin/<view>-data.ts`).
