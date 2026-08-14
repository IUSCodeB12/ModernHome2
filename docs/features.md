# Feature map — where the code lives

The app is a Next.js App Router project, so a feature is spread across three
trees by design: **routes** in `app/`, **UI** in `components/`, **logic/data**
in `lib/`. This map is the index: find a feature, get every file that touches it.

Convention: routes/actions in `app/`, components in `components/<area>/`, non-UI
in `lib/<domain>/`. Server actions are colocated with their route as `actions.ts`.

---

## Home / marketing
- **Routes:** `app/(site)/page.tsx`, `app/(site)/layout.tsx`, `app/globals.css`
- **UI:** `components/home/*` — `hero.tsx` (editorial split), `hero-carousel.tsx`
  (photo slideshow), `hero-room-canvas.tsx` (3D room panel), `static-hero.tsx`
  + `woven-canvas.tsx` (legacy, unused), and sections: `trust-strip`,
  `how-it-works`, `services-grid`, `before-after`, `recent-jobs`, `testimonials`,
  `faq`, `cta-finale`, plus motion helpers `reveal`, `stagger-title`, `section-header`
- **3D:** `components/three/*` — `room.tsx` (public API), `room-parts.tsx`
  (geometry), `room-tour*.tsx` (scroll tour), `decor`, `hotspot`, `hero-scene` (legacy)
- **Logic:** `lib/home/data.ts`, `lib/three/{textures,tour}.ts`, `hooks/use-scene-mode.ts`

## Hero slideshow (admin-managed)
- **Public:** `components/home/hero-carousel.tsx`, fed by `lib/home/data.ts` (`heroSlides`)
- **Admin:** `app/(admin)/admin/(dashboard)/hero/{page,actions}.tsx`,
  `components/admin/hero-slides-manager.tsx`, `lib/admin/hero-data.ts`
- **DB:** `hero_slides` table (images in the `gallery` bucket under `hero/`)

## Services
- **Routes:** `app/(site)/services/page.tsx`, `app/(site)/services/[slug]/page.tsx`
- **UI:** `components/services/estimate-preview.tsx`, `components/ar/ar-viewer.tsx`
- **Logic:** `lib/services/{data,content}.ts`, `lib/quote/estimate.ts`
- **Admin:** `app/(admin)/.../services/{page,actions}.ts`, `components/admin/service-editor.tsx`

## Quote wizard
Five steps: service → details → time → contact → review. Photo prompts are
inline per question (`question-field.tsx`), not a step of their own, and email
verification happens on the review step at confirm time rather than mid-flow.
- **Routes:** `app/(site)/quote/{page,actions}.ts`
- **UI:** `components/quote/*` — `wizard.tsx`, `step-{service,questions,slot,contact,review}.tsx`,
  `question-field.tsx`, `photo-capture.tsx`, `photo-store.ts`, `inline-verify.tsx`,
  `progress-rail.tsx`, `animated-price.tsx`
- **Logic:** `lib/quote/{types,wizard-state,answers,estimate,image,demo-data,saved-contact}.ts`,
  `lib/slots.ts` (availability engine)
- Drafts persist in `localStorage` for 7 days (`wizard-state.ts`); pending photo
  blobs are in-memory only and do not survive a reload.
- **Returning customers skip the contact form.** `getQuoteIdentity()` merges
  `profiles` (name/phone/suburb/postcode, written back on every submit) with the
  latest `bookings` row (street address, access notes — they're per-job columns,
  not profile ones) into a one-tap "Use these details" card. Signed-in users get
  a read-only email: the action ties the quote to the session user and never
  stores a typed address.

## Bookings lifecycle (the big cross-cutting one)
Enquiry → quote → accept → deposit → job → invoice → receipt.
- **Customer routes:** `app/(site)/portal/{page,[id]/page,[id]/actions,[id]/receipt/route}.ts`
- **Customer UI:** `components/portal/{quote-response,payment-panel,reschedule-request,journey-rail,portal-status,photo-strip}.tsx`
- **Admin routes:** `app/(admin)/.../bookings/{page,actions}.ts`,
  `app/(admin)/.../quotes/{page,[id]/page,actions}.ts`, `.../invoices/{page,actions}.ts`
- **Admin UI:** `components/admin/{bookings-view,booking-drawer,quotes-table,quote-actions,quote-photos,invoice-editor}.tsx`
- **Logic:** `lib/bookings/status.ts` (state machine), `lib/bookings/journey.ts` (the
  5-stage customer-facing view of those statuses), `lib/invoice/{calc,create,receipt-pdf}.tsx`,
  `lib/email/{notify,send}.ts`, `lib/admin/{bookings-data,quotes-data,invoices-data}.ts`
- **DB:** `bookings`, `quote_requests`, `invoices` (+ slot exclusion constraint, status-sync trigger)

## Calendar / availability
- **Routes:** `app/(admin)/.../calendar/{page,actions}.ts`
- **UI:** `components/admin/{calendar-week,availability-manager}.tsx`
- **Logic:** `lib/admin/calendar-data.ts`, `lib/slots.ts`

## Gallery
- **Public:** `app/(site)/gallery/page.tsx`, `components/gallery/{gallery-grid,before-after-slider}.tsx`, `lib/gallery/data.ts`
- **Admin:** `app/(admin)/.../gallery/{page,actions}.ts`, `components/admin/gallery-manager.tsx`

## Auth
- **Routes:** `app/(site)/login/page.tsx`, `app/(admin)/admin/login/page.tsx`,
  `app/auth/{confirm/route,error/page}.ts`
- **UI:** `components/auth/{auth-card,otp-input,resend-timer,google-button}.tsx`,
  `components/site/user-menu.tsx`, `components/admin/{mfa-setup,admin-auth-shell}.tsx`
- **Logic:** `lib/auth/{roles,redirect,navigate}.ts`, `lib/supabase/{server,client,middleware}.ts`,
  `lib/admin/guard.ts` (`assertAdmin` — role + aal2)

## Account settings (customer)
- `app/(site)/portal/settings/{page,actions}.ts`, `components/portal/settings-form.tsx`

## Admin dashboard shell
- **Layout/nav:** `app/(admin)/admin/(dashboard)/layout.tsx`
- **Home:** `app/(admin)/admin/(dashboard)/page.tsx`, `lib/admin/dashboard-data.ts`,
  `components/admin/new-requests-watcher.tsx`
- **Customers:** `.../customers/page.tsx`, `components/admin/customers-list.tsx`, `lib/admin/customers-data.ts`
- **Settings:** `.../settings/page.tsx` (hosts MFA)

## Cross-cutting / shared
- **UI primitives:** `components/ui/*` (shadcn + `status-badge`)
- **Site chrome:** `components/site/{site-header,mobile-menu,user-menu,floating-cta}.tsx`
- **Supabase clients:** `lib/supabase/{client,server,admin,middleware}.ts` (see CLAUDE.md)
- **SEO:** `components/seo/json-ld.tsx`, `lib/seo/json-ld.ts`, `app/{robots,sitemap,icon,opengraph-image}.ts(x)`
- **Email:** `lib/email/{send,notify}.ts` (send is real once RESEND_API_KEY is set)
- **Types:** `lib/database.types.ts` (generated), `types/model-viewer.d.ts`
- **Utils:** `lib/utils.ts` (`cn`)
