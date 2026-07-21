# Architecture

## Overview

ModernHome is a server-first Next.js 15 App Router app backed by Supabase. Most pages are
**React Server Components** that read data directly from Supabase; interactivity (wizard,
3D, admin editors, drag-drop pipeline) lives in `"use client"` islands. Writes go through
**server actions** (`"use server"`), not API routes.

```
Browser ──▶ RSC page (server) ──▶ Supabase (RLS as user)
   │                                   ▲
   │  client island ── server action ──┘  (mutations, revalidatePath)
   │
   └─ 3D canvas / wizard state (client-only)
```

## Rendering & data flow

1. A route's `page.tsx` runs on the server, calls a `lib/<feature>/data.ts` loader (or
   Supabase directly), and passes plain data into components.
2. Loaders use the **cookie-bound server client** (`lib/supabase/server.ts`) so Row Level
   Security scopes every read to the signed-in user. When Supabase env vars are absent
   (`isSupabaseConfigured()` is false), loaders return **demo data** so the UI still renders.
3. Cross-user reads that RLS forbids (e.g. everyone's busy booking slots for the quote
   calendar) use the **service-role client** (`lib/supabase/admin.ts`) — server-only, and
   only slot times are ever sent to the client.
4. Mutations are server actions colocated as `app/**/actions.ts`; they validate with zod,
   write via the appropriate client, then `revalidatePath`. The admin dashboard also uses
   Supabase **Realtime** for live updates.

## Data access layers

- **UI** (`components/`) — presentational + client interactivity; no direct DB calls in
  shared components (pages/actions fetch and pass data down).
- **Domain logic** (`lib/<feature>/`) — data loaders, pure business math (estimate, invoice,
  slot engine), state helpers. Pure functions are unit-tested with Vitest.
- **Data source** (Supabase) — Postgres with RLS; schema owned by `supabase/migrations/`.
  Types are generated into `lib/database.types.ts`.

## Authentication & authorization

- **Passwordless**: customers sign in with a 6-digit email OTP (`app/(site)/login`,
  verified at `app/auth/confirm`). Google OAuth is planned. Sessions are cookie-based via
  `@supabase/ssr`, refreshed in `lib/supabase/middleware.ts`.
- **Authorization**: RLS enforces per-user data access at the database. Admin surfaces are
  gated by `isAdmin()` (`lib/auth/roles.ts`), which reads `profiles.role`; middleware
  blocks `/admin/*` for non-admins. Redirects pass through `safeNext()`
  (`lib/auth/redirect.ts`) to prevent open-redirects.

## State management

No global store. State lives at the smallest scope that works:

- **Server state** — RSC + server actions + `revalidatePath` are the source of truth.
- **Wizard** — `react-hook-form` + zod, persisted to `sessionStorage` across steps
  (`lib/quote/wizard-state.ts`).
- **3D** — R3F internal state; `hooks/use-scene-mode.ts` decides static-vs-interactive
  based on intent, viewport, and reduced-motion.

## 3D & performance

The hero and scroll-tour share one geometry (`RoomGeometry` in `components/three/room.tsx`,
built from leaf parts in `room-parts.tsx`). Canvases are **lazy and gated**: they mount only
on user intent or when scrolled into view (IntersectionObserver), with a static poster
fallback and a reduced-motion path. This keeps Lighthouse mobile ≥ 95. Textures
(`lib/three/textures.ts`) are generated procedurally at runtime — no image downloads.

## Deferred / stubbed

- **Stripe** deposit checkout — not wired.
- **Resend** transactional emails (booking/quote) — `lib/email/send.ts` is a stub. (Resend
  SMTP *is* live for Supabase auth OTP emails.)

These are intentional production-time tasks; keep their seams (the stub signatures) stable.
