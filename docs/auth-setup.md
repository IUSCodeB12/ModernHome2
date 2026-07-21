# Auth 6 — external configuration checklist

These steps happen in third-party dashboards (Supabase, Google Cloud, Cloudflare),
not in code. Do them in order. Values in `.env.local` are gitignored — never commit them.

Reference URLs:
- Prod: `https://modern-home2.vercel.app`
- Local: `http://localhost:3000`

---

## 1. Supabase URL configuration
Supabase → **Authentication → URL Configuration**
- **Site URL:** `https://modern-home2.vercel.app`
- **Redirect URLs** (add all):
  - `https://modern-home2.vercel.app/**`
  - `https://modern-home2.vercel.app/auth/confirm`
  - `https://modern-home2.vercel.app/auth/callback`   ← Google OAuth (see §3)
  - `https://modern-home2.vercel.app/admin/reset`      ← admin password recovery (Auth 4)
  - `http://localhost:3000/**` (local dev)

## 2. Email / OTP (Resend SMTP)  — mostly already done
Supabase → **Authentication → Emails**
- SMTP: host `smtp.resend.com`, user `resend`, password = Resend API key, sender `onboarding@resend.dev` (or your verified domain).
- **Email OTP length: 6** (matches the 6-box input).
- OTP template uses `{{ .Token }}` (sends a code, not a link). Already configured.
- ⚠️ **Verify your own domain in Resend** so customer emails don't hit the test-domain restriction (only the account owner receives mail on the test sender) and to avoid spam folders.

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
- `NEXT_PUBLIC_SITE_URL=https://modern-home2.vercel.app`
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
