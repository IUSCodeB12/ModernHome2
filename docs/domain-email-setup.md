# Domain + email — go-live runbook

Connecting `acestudio55.com.au` and switching transactional email from stub to real.

DNS is managed at **the registrar** (where the domain was bought), so every record
below goes in that control panel.

**Do the steps in order.** Steps 3–4 flip the site over to the new domain, and they
only work once 1–2 have gone green. Flipping early takes the site down.

---

## What's already done in code

Nothing below requires a code change — the domain lives in exactly one constant.

| File | Value |
|---|---|
| `lib/brand.ts` | `domain: "acestudio55.com.au"`, `email: "bookings@acestudio55.com.au"` |
| `app/sitemap.ts`, `app/robots.ts`, `lib/email/send.ts` | derive from `SITE_ORIGIN` — no hardcoded hosts |
| `supabase/email-templates/otp.html` | branded AceStudio55 |

`NEXT_PUBLIC_SITE_URL` overrides `BRAND.domain` at runtime, so previews and prod differ correctly.

---

## 1. Point the domain at Vercel

Vercel → Project → **Settings → Domains** → Add `acestudio55.com.au`.
Add `www.acestudio55.com.au` too and set it to **redirect to the apex** (one canonical
host — two live hosts split SEO and break OAuth redirects).

Vercel then shows the exact records to create at your registrar. They're normally:

| Type | Name / Host | Value |
|---|---|---|
| `A` | `@` (apex) | `76.76.21.21` |
| `CNAME` | `www` | `cname.vercel-dns.com` |

⚠️ **Use the values Vercel's dashboard shows, not these** — Vercel has changed its apex
IP and region-specific CNAMEs before, and the dashboard is authoritative.

Some registrars won't accept `@` for the host; leave it blank or use the bare domain instead.

**Wait for green.** Vercel issues the TLS certificate automatically once DNS resolves —
usually minutes, occasionally a few hours. Don't continue until Vercel says *Valid
Configuration* and `https://acestudio55.com.au` loads.

## 2. Verify the domain in Resend

Resend → **Domains → Add Domain** → `acestudio55.com.au`. Pick the region closest to
Melbourne that Resend offers — it only affects sending latency, not deliverability.

Resend generates records unique to your account. Copy them **exactly**; the DKIM key in
particular is a long one-off string that can't be guessed or reused:

| Type | Name / Host | Purpose |
|---|---|---|
| `TXT` | `resend._domainkey` | DKIM — signs your mail so receivers can prove it's you |
| `TXT` | `send` | SPF — authorises Resend's servers to send as you |
| `MX` | `send` | bounce and complaint feedback |

Then click **Verify**. It goes green in minutes if the records are right.

**Add DMARC as well** — not strictly required, but Gmail and Yahoo now demote or reject
bulk senders without it:

| Type | Name / Host | Value |
|---|---|---|
| `TXT` | `_dmarc` | `v=DMARC1; p=none; rua=mailto:bookings@acestudio55.com.au` |

`p=none` monitors without blocking anything. Tighten to `p=quarantine` later, once you've
confirmed legitimate mail passes.

### Common failures
- **Records not found** — the registrar auto-appended the domain, giving you
  `resend._domainkey.acestudio55.com.au.acestudio55.com.au`. Enter the host part only.
- **Split SPF** — if a TXT SPF record already exists on that host, *merge* it. Two SPF
  records on one host is a hard fail; one record with two `include:` terms is correct.

## 3. Set up an inbox (separate from sending)

Resend sends mail; it does **not** receive it. Right now a customer replying to
`bookings@acestudio55.com.au` gets a bounce — and every transactional email invites a
reply ("Reply to this email if you'd like to discuss options" in `quote_rejected`).

Pick one:
- **Registrar email forwarding** — free at most AU registrars, forwards to your Gmail.
  Fine to start; you can't reply *as* `bookings@` without extra Gmail SMTP setup.
- **Google Workspace / Fastmail** — a real mailbox, ~$8–10/month, send and receive properly.

Adding a mailbox means **MX records on the apex** — those are separate from Resend's MX on
the `send` subdomain, and the two don't conflict.

Once mail actually arrives, set `email` in `lib/business.ts` so the footer and invoices
publish it. It's deliberately `null` until then.

## 4. Supabase URLs

Supabase → **Authentication → URL Configuration**:
- **Site URL:** `https://acestudio55.com.au`
- **Redirect URLs:** `https://acestudio55.com.au/**`, plus the `/auth/confirm` and
  `/auth/callback` entries listed in `docs/auth-setup.md` §1. Keep `http://localhost:3000/**`.

Supabase → **Authentication → Emails** → SMTP: sender `bookings@acestudio55.com.au`
(host `smtp.resend.com`, port `465`, user `resend`, password = Resend API key).

Keep the old `*.vercel.app` redirect URLs until step 5 is deployed and verified — removing
them first logs out anyone mid-session on the old host.

## 5. Vercel env vars, then redeploy

Vercel → Settings → **Environment Variables** (Production):

```
NEXT_PUBLIC_SITE_URL=https://acestudio55.com.au
RESEND_API_KEY=re_...
EMAIL_FROM=AceStudio55 <bookings@acestudio55.com.au>
```

**Redeploy** — `NEXT_PUBLIC_*` vars are inlined at build time, so an env change alone
changes nothing until a new build runs.

`RESEND_API_KEY` is what flips email from stub to live: `lib/email/send.ts` logs the
payload and returns `{ skipped: true }` while it's unset. Leave it unset in Preview so
preview deploys can't email real customers.

---

## Verify it worked

1. `https://acestudio55.com.au` loads over HTTPS; `www.` redirects to it.
2. `https://acestudio55.com.au/robots.txt` — sitemap URL shows the new domain, not `.vercel.app`.
   (If it doesn't, `NEXT_PUBLIC_SITE_URL` didn't reach the build — redeploy.)
3. Sign in with a **non-admin** email — the OTP arrives branded, from `bookings@`.
4. Send yourself a real transactional email end-to-end: create a test quote, mark it ready,
   confirm it lands in the **inbox, not spam**.
5. Reply to that email and check the reply arrives (step 3).
6. Check the Resend dashboard for bounces or spam complaints.

Test with a Gmail address *and* an Outlook/Hotmail one — they filter very differently,
and a brand-new sending domain has no reputation yet. Expect the first few sends to be
scrutinised; volume over time is what builds reputation.

---

## Also worth doing

`.com.au` requires an ABN or ACN to register, so you now have one on file with the
registrar — but `lib/business.ts` still has `abn: null` and `legalName: null`. Filling
those in (and `email`, after step 3) makes `isBusinessRegistered()` true, which takes the
legal pages out of draft and puts a real ABN on tax invoices. Worth a follow-up session —
it's a tax-facing change, not a display one.
