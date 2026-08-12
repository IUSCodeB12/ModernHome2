# Auth 6 — external configuration checklist

These steps happen in third-party dashboards (Supabase, Google Cloud, Cloudflare),
not in code. Do them in order. Values in `.env.local` are gitignored — never commit them.

Reference URLs:
- Prod: `https://www.acestudio55.com.au`
- Local: `http://localhost:3000`

---

## 1. Supabase URL configuration
Supabase → **Authentication → URL Configuration**
- **Site URL:** `https://www.acestudio55.com.au`
- **Redirect URLs** (add all):
  - `https://www.acestudio55.com.au/**`
  - `https://www.acestudio55.com.au/auth/confirm`
  - `https://www.acestudio55.com.au/auth/callback`   ← Google OAuth (see §3)
  - `http://localhost:3000/**` (local dev)

## 2. Email / OTP (Resend SMTP)
Supabase → **Authentication → Emails**
- SMTP: host `smtp.resend.com`, port `465`, user `resend`, password = Resend API key,
  sender `bookings@acestudio55.com.au`.
- **Email OTP length: 6** (matches the 6-box input).
- OTP template uses `{{ .Token }}` (sends a code, not a link). Paste
  `supabase/email-templates/otp.html` — a file in *this repo*, not something Supabase
  hosts — into **both** templates under Authentication → Emails → **Templates**:
  **Magic link or OTP** (existing addresses) and **Confirm sign up** (first-time
  addresses). Subject on both: `Your AceStudio55 sign-in code`. Everything else on that
  page is unused — the app is fully passwordless, so Reset password and Reauthentication
  never fire.

⚠️ The sender only works once `acestudio55.com.au` is **verified in Resend** — until then
every send 403s. Domain verification and its DNS records are a prerequisite:
see **`docs/domain-email-setup.md`**, which is the runbook for §1–§2 and Vercel DNS.

## 3. Google OAuth  (needs code + config)
**Google Cloud Console** → APIs & Services → Credentials → OAuth 2.0 Client ID (Web):
- Authorized redirect URI: `https://<PROJECT_REF>.supabase.co/auth/v1/callback`
- Copy the **Client ID** and **Client Secret**.

**Supabase** → Authentication → Providers → **Google**: enable, paste Client ID + Secret.

**Code still to write (defer to a fresh session):**
- Wire `components/auth/google-button.tsx` →
  `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: <origin>/auth/callback } })`.
- Add `app/auth/callback/route.ts` that calls `supabase.auth.exchangeCodeForSession(code)`
  then redirects to `next` (validated with `safeNext`).

## 4. Turnstile (bot protection on sign-in)  (needs code + config)
**Cloudflare** → Turnstile → add site → get **Site Key** (public) + **Secret Key**.
- Add to env: `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` (Vercel + `.env.local`).

**Code still to write (defer):**
- Turnstile widget on `/login` and `/admin/login`.
- Server-side verify (`https://challenges.cloudflare.com/turnstile/v0/siteverify`) in the
  OTP-send / sign-in path before issuing a code.

## 5. Production env vars (Vercel)
Vercel → Project → Settings → Environment Variables (Production + Preview):
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL=https://www.acestudio55.com.au`
- (after §4) `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`
- Redeploy after changes.

## 6. Enable MFA (Auth 4 dependency)
Supabase → Authentication → **MFA**: ensure **TOTP** is enabled so `/admin/settings`
enrollment works.

---

### Status
- §1, §2, §5, §6: **your dashboard steps** (no code needed).
- §3, §4: config **plus** code — the code is scoped above and should be built in a
  fresh session once you have the keys, so it can be tested end to end.
