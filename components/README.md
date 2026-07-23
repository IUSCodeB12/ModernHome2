# components/

React components, grouped by area. See `docs/features.md` for the full
per-feature file map.

| Folder | What's in it |
|--------|--------------|
| `ui/` | shadcn primitives + `status-badge` — shared, no business logic |
| `site/` | Site chrome: header, mobile menu, user menu, floating CTA |
| `home/` | Homepage hero + sections + 3D room panel + motion helpers |
| `three/` | React Three Fiber room (`room`, `room-parts`, tour, decor, hotspots) |
| `services/` | Service-detail widgets (estimate preview) |
| `quote/` | Quote wizard and its steps |
| `gallery/` | Public gallery grid + before/after slider |
| `portal/` | Customer portal actions: accept/decline, payment, reschedule, settings |
| `auth/` | Reusable auth UI (auth card, OTP input, resend timer, Google button) |
| `admin/` | Admin dashboard views/editors (bookings, quotes, invoices, gallery, hero, MFA, …) |
| `ar/` | `model-viewer` AR wrapper |
| `seo/` | JSON-LD `<script>` renderer |

Rule of thumb: **public/customer UI** lives in its feature folder (`home`,
`quote`, `portal`, `gallery`, `services`); **admin dashboard UI** lives in
`admin/`; **cross-surface primitives** live in `ui/` and `site/`.
