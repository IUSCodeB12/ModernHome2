# Tradie Installation Business — Full Build Plan for Claude Code

How to use this file:
1. Paste the **PROJECT BRIEF** into your repo as `CLAUDE.md` before anything else (Claude Code reads it automatically every session).
2. Then run the phases **one at a time**, pasting each phase prompt into Claude Code. Don't skip ahead — each phase assumes the previous one is done and committed.
3. Commit at the end of every phase. If a phase goes sideways, `git reset` and re-run the prompt.

---

## PROJECT BRIEF (save as CLAUDE.md in repo root)

```markdown
# [ModernHomesAndCabinet] — Booking & Quoting Platform

## What this is
A customer-facing website + admin dashboard for a cabinet/TV installation
business in Victoria, Australia. Services: TV wall mounting, TV/floating
cabinets, showcase cabinets, LED strip lighting, room heater installation.

Customers get an instant estimate through a guided quote wizard (photos +
tap-answer questions), pay a deposit, and book a time slot. Admin reviews
and approves/adjusts quotes, manages the calendar, sends invoices.

## Tech stack (do not deviate without asking)
- Next.js 15 (App Router) + TypeScript (strict)
- Tailwind CSS v4 + shadcn/ui
- Supabase: Postgres, Auth, Storage, Realtime, RLS
- Stripe (Checkout + webhooks) for deposits/payments — AUD, 10% GST
- Resend + React Email for transactional email
- @react-pdf/renderer for quote/invoice PDFs
- react-hook-form + zod for all forms
- react-three-fiber + drei for the 3D homepage (Phase 5 only)
- @google/model-viewer for AR "view in your room" (Phase 5 only)

## Project structure
- app/(site)/...    → public site: home, services, gallery, quote wizard, customer portal
- app/(admin)/...   → protected admin dashboard
- app/api/...       → route handlers (Stripe webhooks, PDF generation)
- lib/supabase/     → client/server Supabase helpers
- lib/email/        → React Email templates + send helpers
- components/       → shared UI
- supabase/migrations/ → all schema changes as SQL migrations

## Conventions
- Server Components by default; "use client" only when needed
- All DB access through Supabase with RLS enforced — never service-role key
  in anything client-reachable except webhooks/admin server actions
- Zod schemas in lib/schemas/ shared between client validation and server actions
- All money stored as integer cents, AUD. GST = 10%, shown as separate line
- Dates/times: store UTC, display Australia/Melbourne
- Mobile-first responsive — most customers will be on phones
- Every phase must pass: pnpm typecheck && pnpm lint && pnpm build

## Business rules
- Booking requires an approved-range estimate + deposit payment (default 20%, min $50)
- Job pipeline statuses: enquiry → quoted → approved → booked → in_progress → completed → invoiced → paid → (cancelled)
- Quotes expire after 14 days
- Working hours default Mon–Sat, defined in availability table; slots are 2-hour arrival windows
- Customer auth = magic link (no passwords). Admin auth = email/password + admin role check
```

---

## PHASE 0 — Project scaffold

**Paste into Claude Code:**

```
Scaffold the project.

1. Create a Next.js 15 App Router project with TypeScript (strict), Tailwind v4,
   ESLint, pnpm. Add shadcn/ui (init with neutral base color).
2. Install: @supabase/supabase-js @supabase/ssr react-hook-form zod
   @hookform/resolvers stripe @stripe/stripe-js resend @react-email/components
   @react-pdf/renderer date-fns date-fns-tz lucide-react
3. Set up route groups: app/(site) with a basic layout (header with logo
   placeholder, nav: Services, Gallery, Get a Quote, My Bookings; footer with
   ABN/contact placeholders) and app/(admin) with a sidebar layout (Dashboard,
   Bookings, Quotes, Calendar, Gallery, Invoices, Customers, Settings).
4. Create lib/supabase/client.ts, lib/supabase/server.ts, and middleware.ts
   using @supabase/ssr patterns. Protect all (admin) routes: redirect to
   /admin/login unless the user has role 'admin' (check a profiles table —
   schema comes in Phase 1, so stub the check behind a helper for now).
5. Create .env.example listing: NEXT_PUBLIC_SUPABASE_URL,
   NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
   STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
   STRIPE_WEBHOOK_SECRET, RESEND_API_KEY, NEXT_PUBLIC_SITE_URL.
6. Add scripts: typecheck, lint. Verify pnpm build passes.
7. Simple placeholder homepage (hero image + "Get an instant quote" CTA
   linking to /quote). The 3D homepage comes in a later phase — do NOT
   install three.js yet.

Deliverable: clean build, both layouts render, admin routes redirect when
logged out.
```

---

## PHASE 1 — Database schema, auth, seed data

**Paste into Claude Code:**

```
Build the full Supabase schema as SQL migration files in supabase/migrations/.
Use the Supabase CLI conventions so I can run `supabase db push`.

Tables (all with created_at/updated_at, RLS enabled):

1. profiles — id (uuid, FK auth.users), full_name, phone, role
   ('customer' | 'admin'), suburb, postcode. Trigger to auto-create on signup.
2. services — id, slug, name, description, base_price_cents,
   price_unit ('fixed' | 'per_metre' | 'per_hour'), active, sort_order,
   ar_model_glb_url (nullable), ar_model_usdz_url (nullable), hero_image_url.
3. service_questions — id, service_id FK, question_text, input_type
   ('single_select' | 'multi_select' | 'number' | 'boolean'), options jsonb
   (array of {label, value, price_modifier_cents, price_modifier_pct}),
   requires_photo boolean, photo_guide_text, sort_order.
4. quote_requests — id, customer_id FK profiles, service_id FK, answers jsonb,
   photo_urls text[], estimate_low_cents, estimate_high_cents, status
   ('pending' | 'approved' | 'adjusted' | 'rejected' | 'expired'),
   admin_notes, final_quote_cents (nullable), expires_at.
5. bookings — id, quote_request_id FK, customer_id FK, slot_start timestamptz,
   slot_end timestamptz, status (enquiry/quoted/approved/booked/in_progress/
   completed/invoiced/paid/cancelled), deposit_cents, deposit_paid_at,
   stripe_checkout_session_id, address_line1, suburb, postcode, access_notes.
6. availability_rules — id, day_of_week (0-6), start_time, end_time, active.
7. blocked_dates — id, date, reason.
8. invoices — id, booking_id FK, invoice_number (sequential, e.g. INV-0001),
   line_items jsonb, subtotal_cents, gst_cents, total_cents, status
   ('draft' | 'sent' | 'paid'), pdf_url, paid_at, stripe_payment_intent_id.
9. gallery_items — id, title, service_id FK nullable, before_image_url,
   after_image_url (nullable — single-image items allowed), featured, sort_order.

RLS policies:
- Customers: read own profile/quote_requests/bookings/invoices; insert own
  quote_requests. No direct writes to bookings/invoices (server actions only).
- Admins (role check via profiles): full access on everything.
- services, service_questions, gallery_items, availability_rules: public read
  where active=true, admin write.

Storage buckets: 'quote-photos' (private, customers upload to own folder,
admin read), 'gallery' (public read, admin write), 'invoices' (private),
'models' (public read — for .glb/.usdz AR files).

Also:
1. Wire up magic-link auth for customers at /login and email/password admin
   login at /admin/login. Replace the Phase 0 role-check stub with the real
   profiles lookup.
2. Write a seed migration with the 5 services and realistic questions:
   - TV Wall Mounting: TV size (43"/55"/65"/75"+, modifiers), wall type
     (plasterboard/brick/concrete, modifiers), cable concealment (boolean,
     +$120), requires_photo: wall photo + power point photo
   - TV / Floating Cabinet: cabinet width (number, per_metre pricing),
     wall type, LED backlight add-on (boolean)
   - Showcase Cabinet: size select, glass shelves (boolean), integrated
     lighting (boolean), requires_photo: room corner photo
   - LED Strip Lighting: length in metres (number, per_metre), location
     (kitchen kickboard/ceiling cove/cabinet/other), dimmer (boolean)
   - Room Heater Installation: heater type (panel/strip/existing unit),
     wall type, requires_photo
   Use sensible AUD placeholder prices — I'll adjust in admin later.
3. Generate TypeScript types from the schema into lib/database.types.ts.

Deliverable: migrations apply cleanly, seed data visible, auth works for
both roles, typecheck passes.
```

---

## PHASE 2 — Quote wizard + slot engine (the money path)

**Paste into Claude Code:**

```
Build the customer quote-and-book flow at /quote. Multi-step wizard,
mobile-first, react-hook-form + zod per step, state persisted in
sessionStorage so refresh doesn't lose progress.

Steps:
1. Choose service — card grid from services table (image, name, "from $X").
2. Job details — render that service's service_questions dynamically by
   input_type. Show a live estimate range at the bottom that updates as they
   answer (base price + modifiers; for per_metre, multiply). Estimate range =
   calculated price ±15%, rounded to nearest $10.
3. Photos — for each question with requires_photo, an upload card showing
   photo_guide_text and an example silhouette. Compress client-side
   (max 1600px, ~80% JPEG) before uploading to the quote-photos bucket under
   {user_id}/{quote_request_id}/. Allow camera capture on mobile.
4. Your details + address — if not logged in, collect email and send magic
   link inline (they verify without losing wizard state); collect name,
   phone, address, suburb, postcode, access notes.
5. Pick a slot — build the slot engine:
   - lib/slots.ts: given a date range, availability_rules, blocked_dates,
     and existing bookings, return open 2-hour arrival windows in
     Australia/Melbourne time. Unit-test this with vitest (add vitest).
   - UI: next 14 days as horizontal day-picker, slots as tap buttons.
     Min 24h lead time.
6. Review & hold — summary of everything + estimate range + deposit amount
   (20% of estimate midpoint, min $50). Button says "Pay deposit & book".
   For THIS phase, clicking it creates the quote_request (status pending)
   and booking (status enquiry) rows and shows a success screen —
   Stripe wiring is Phase 4. Mark the code with a clear TODO(stripe).

Also build /portal (customer): list their bookings + quote requests with
status badges, estimate/final quote, slot time, and a detail page.

Deliverable: full wizard works end-to-end on mobile viewport, slot engine
tests pass, rows land correctly in Supabase, RLS verified (customer A can't
see customer B's data).
```

---

## PHASE 3 — Admin dashboard

**Paste into Claude Code:**

```
Build the admin dashboard in app/(admin). Use shadcn/ui tables, dialogs,
badges. Supabase Realtime so new quote requests appear without refresh.

Pages:
1. /admin (Dashboard) — stat cards: new requests, jobs this week, revenue
   this month (sum paid invoices), pending quotes. Below: today's +
   tomorrow's bookings list.
2. /admin/quotes — table of quote_requests, filter by status. Detail view:
   customer info, all answers rendered readably, photo gallery (signed URLs,
   lightbox), the auto-estimate. Actions:
   - Approve as-is (final_quote = estimate midpoint)
   - Adjust: editable line-items editor (description, qty, unit price) that
     recalculates subtotal/GST/total → sets final_quote_cents, status
     'adjusted'
   - Reject with reason
   Approve/adjust moves linked booking to 'quoted' and (Phase 4) emails the
   customer. Stub the email call behind lib/email/send.ts with TODO(resend).
3. /admin/bookings — pipeline board (columns per status, drag between
   allowed transitions) plus a table view toggle. Detail drawer: everything
   about the job, status buttons, link to quote and invoice.
4. /admin/calendar — week view of bookings; manage availability_rules and
   blocked_dates (e.g. block a day for holidays).
5. /admin/gallery — upload before/after pairs to the gallery bucket
   (drag-and-drop, image compression), reorder, toggle featured, assign to
   a service.
6. /admin/services — edit services and their questions/options/pricing
   modifiers. This is important: I must be able to tune pricing without
   code changes.
7. /admin/customers — searchable customer list with job history.

All mutations via server actions with zod validation and admin-role
assertion. Deliverable: I can process a quote request from Phase 2 end to
end: review photos → adjust price → approve → booking shows on calendar.
```

---

## PHASE 4 — Stripe, Resend emails, PDF quotes & invoices

**Paste into Claude Code:**

```
Wire up money and email.

Stripe:
1. Replace the TODO(stripe) in the wizard: "Pay deposit & book" creates a
   Stripe Checkout Session (AUD, deposit amount, customer email prefilled,
   metadata: booking_id) and redirects. Success URL → /portal with success
   toast; cancel → back to review step.
2. /api/stripe/webhook: verify signature; on checkout.session.completed set
   deposit_paid_at, move booking to 'booked', decrement slot availability
   is implicit via the booking row. Idempotent handling.
3. Invoice payment: from the portal, "Pay invoice" creates a Checkout
   Session for the balance (total minus deposit). Webhook marks invoice
   paid, booking → 'paid'.

PDFs (@react-pdf/renderer, generated in route handlers, stored in the
invoices bucket, path saved on the row):
4. Quote PDF: branded header ([ModernHomeCabinet], ABN placeholder), customer
   details, line items, subtotal, GST 10%, total, validity date, terms
   footer.
5. Tax invoice PDF: same layout, invoice_number, "Tax Invoice" per ATO
   requirements (ABN, GST amount shown, date of issue), deposit shown as
   credit, balance due.

Emails (Resend + React Email, templates in lib/email/templates/, one shared
branded layout):
6. quote-received (to customer, instant), new-request (to admin),
   quote-approved (customer, with quote PDF link + "book/pay" CTA),
   deposit-receipt, booking-confirmed (with slot time, address on file,
   what-to-expect), reminder-24h (add a Vercel cron route for this),
   invoice-sent (with PDF + pay link), payment-receipt, review-request
   (sent 1 day after status 'paid', with a Google review link from an env
   var — same cron route).
7. Replace all TODO(resend) stubs. All emails fire from status transitions
   in one place: lib/lifecycle.ts — a single transitionBooking(id, newStatus)
   function that updates the row, sends the right emails, and logs to a
   simple audit_log table (add migration).

Deliverable: full happy path with Stripe test mode — quote → approve →
deposit → booked → complete → invoice → pay → review request. Use `stripe
listen` locally for webhooks; document the commands in README.
```

---

## PHASE 5 — 3D interactive homepage + AR

**Paste into Claude Code:**

```
Now the showpiece. Install three @react-three/fiber @react-three/drei and
@google/model-viewer.

3D homepage:
1. Replace the placeholder hero with an interactive 3D lounge-room scene:
   a stylised room containing a wall-mounted TV with floating cabinet
   (LED glow underneath), a showcase cabinet, an LED cove light along the
   ceiling, and a panel heater on one wall.
2. Build the room from three.js primitives + simple materials (no heavy
   GLTF for v1) — clean, low-poly, brand-coloured. Soft shadows,
   environment lighting from drei.
3. Each installable item is a hotspot: hover (desktop) = subtle glow +
   floating label; click/tap = smooth camera dolly to it (drei
   CameraControls) then navigate to that service's page. Include an
   obvious "Get an instant quote" CTA overlaid at all times.
4. Subtle idle animation (LED strip colour cycling slowly).
5. Performance: lazy-load the canvas (next/dynamic, ssr:false), suspense
   fallback = static hero image, cap DPR at 1.5, pause rendering when tab
   hidden. Lighthouse mobile performance must stay ≥ 80 — if the scene
   can't hit that, degrade to the static hero on low-end devices via
   navigator.hardwareConcurrency heuristic.

AR on service pages:
6. On each service page, if ar_model_glb_url is set, render a
   <model-viewer> block: "See it in your room" — ar, ar-modes
   "scene-viewer webxr quick-look", ios-src from ar_model_usdz_url,
   camera-controls, poster image. Wrap it in a client component.
7. Add a fields section in /admin/services to upload .glb and .usdz files
   to the models bucket and set the URLs.
8. Add one placeholder .glb (a simple box-shaped floating cabinet you
   generate procedurally and export, or any CC0 cabinet model) so the flow
   is testable before I commission real models.

Deliverable: homepage scene interactive on desktop + mobile, graceful
fallback works, AR button launches Quick Look / Scene Viewer on a real
phone.
```

---

## PHASE 6 — Polish, SEO, launch readiness

**Paste into Claude Code:**

```
Final pass before launch.

1. Gallery page: masonry grid, before/after slider component (drag handle),
   filter by service.
2. Service pages: hero, pricing-from, FAQ accordion (content placeholders),
   gallery items for that service, AR block, sticky "Get a quote" CTA.
3. SEO: metadata API for every page, LocalBusiness + Service JSON-LD
   structured data (suburb targeting: Shepparton, Greater Melbourne —
   env-configurable service areas), sitemap.xml, robots.txt, OpenGraph
   images.
4. Customer portal polish: quote acceptance button (customer accepting an
   'adjusted' quote moves it to approved + triggers deposit flow),
   cancellation request (min 48h notice, flags admin, doesn't auto-cancel).
5. Error/empty/loading states everywhere; error.tsx and not-found.tsx.
6. Accessibility pass: keyboard nav through wizard, focus management in
   dialogs, alt text, contrast.
7. Rate-limit the quote endpoints (basic IP-based, upstash optional) and
   add honeypot field to the wizard to stop spam enquiries.
8. README: full setup guide (Supabase, Stripe test mode, Resend domain
   verification, Vercel deploy, cron config, env vars).
9. Run pnpm build, fix everything. Give me a launch checklist of manual
   steps (Stripe live keys, Resend domain DNS, custom domain, Google
   Business review link).
```

---

## Notes for you (not for Claude Code)

- **Costs to expect:** Supabase free tier fine to start; Resend free tier 100 emails/day; Stripe pay-per-transaction; Vercel free/hobby OK pre-launch. 3D models for AR: budget ~$50–150/model on Fiverr, need both .glb and .usdz exports.
- **Order matters:** resist the urge to jump to Phase 5 first. The wizard + admin approval loop is the business.
- **After each phase:** test on your actual phone, not just desktop devtools.
- **When the app comes later:** the Expo app reuses the same Supabase backend and lifecycle functions — it's mostly UI + push notifications.
