# Security hardening & E2E checklist (Auth 7)

## Authorization audit — current state ✅

**Admin server actions** — all wrapped in `adminAction` (`lib/admin/guard.ts`),
which requires a signed-in user with `profiles.role = 'admin'` **and** aal2 when a
TOTP factor is enrolled:

| File | Exported | Guarded |
|------|:--------:|:-------:|
| bookings/actions.ts | 1 | 1 |
| calendar/actions.ts | 4 | 4 |
| gallery/actions.ts | 4 | 4 |
| invoices/actions.ts | 1 | 1 |
| quotes/actions.ts | 3 | 3 |
| services/actions.ts | 2 | 2 |

**Customer server actions** — verify ownership before any privileged write:
- `respondToQuote` (portal accept/decline): loads the booking via the RLS session
  client, then checks `booking.customer_id === user.id` before the service-role update.
- `/portal/settings` actions: `requireUser()` + `.eq("id", user.id)`.
- Receipt route (`/portal/[id]/receipt`): read is RLS-scoped (`invoices_select_own`).

**Defence in depth**: RLS is the real enforcement boundary at the database;
`middleware` gates `/admin/*` (role + aal2) and `/portal/*` (signed-in); server
actions re-check on every mutation.

## Hardened this pass
- `safeNext` open-redirect guard now also rejects the backslash variant
  (`/\evil.com`) and whitespace/control-char smuggling. Unit-tested
  (`lib/auth/redirect.test.ts`).
- Booking status machine unit-tested (`lib/bookings/status.test.ts`) — happy path,
  no self-transitions, no stage-skipping, cancel-from-anywhere, paid is terminal.

Total: 32 unit tests passing (slots, estimate, invoice, safeNext, status).

## Still recommended (not code-blocking)
- **Rate limiting** on OTP send / sign-in — best done at the edge (Supabase Auth
  has some built-in; add Turnstile from Auth 6 to blunt automated abuse).
- **Automated browser E2E** — the repo has no Playwright/Cypress harness. Adding
  one is a separate infra task; until then use the manual checklist below.

## Manual E2E checklist (run on the deployed site)

Customer:
- [ ] Sign in via 6-digit OTP; bad code rejected; resend cooldown works.
- [ ] Submit a quote → appears in `/portal`; another account can't open its `/portal/[id]`.
- [ ] Admin approves/adjusts → customer sees quote + line-item breakdown.
- [ ] Accept → booking `approved`; Decline → `cancelled`.
- [ ] After job: "Payment due" shows invoice total; "Download receipt" returns a PDF.
- [ ] `/portal/settings`: edit profile, change email (confirm mail), delete account.

Admin:
- [ ] `/admin/*` blocked when signed out and for non-admin accounts.
- [ ] Enrol TOTP in `/admin/settings`; sign out; re-login now demands a code.
- [ ] `/admin/reset`: request link → set new password.
- [ ] Move a job `invoiced` → invoice auto-created; add extra work; `paid` → receipt.

Redirects:
- [ ] `/login?next=//evil.com` and `?next=/\evil.com` land on `/portal`, not off-site.
