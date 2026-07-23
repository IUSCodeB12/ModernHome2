# lib/

Non-UI logic, grouped by domain. Server-only unless noted. See
`docs/features.md` for the full per-feature file map.

| Folder / file | What's in it |
|---------------|--------------|
| `supabase/` | Clients: `client` (browser), `server` (RLS), `admin` (service-role), `middleware` |
| `auth/` | `roles` (`isAdmin`), `redirect` (`safeNext`) + tests |
| `quote/` | Wizard types/state, answers, `estimate` math, image compress, demo data |
| `slots.ts` | Availability/slot engine (Australia/Melbourne). Pure + tested |
| `bookings/` | `status` — booking state machine (transitions) + tests |
| `invoice/` | `calc` (GST totals), `create` (invoice from quote), `receipt-pdf` |
| `email/` | `send` (Resend, real when keyed), `notify` (look up customer + send) |
| `services/` | `data` (loader), `content` (per-slug editorial copy) |
| `home/` | `data` — homepage loader (services, featured, recent, hero slides) |
| `gallery/` | `data` — public gallery loader |
| `seo/` | `json-ld` builders (LocalBusiness, Service, FAQ, Breadcrumb) |
| `three/` | Procedural `textures`, camera `tour` keyframes |
| `admin/` | Per-view data loaders (`*-data.ts`), `guard` (`assertAdmin`), `demo` |
| `utils.ts` | `cn` + small shared helpers |
| `database.types.ts` | **Generated** Supabase types — do not hand-split |

Data loaders follow one pattern: read Supabase, fall back to demo data when
`isSupabaseConfigured()` is false. One loader per feature at `lib/<feature>/data.ts`
(or `lib/admin/<view>-data.ts` for admin views).
