/**
 * Navigate after an auth state change (sign-in, OTP verify, MFA, sign-out).
 *
 * Must be a FULL document load, not `router.push`. The browser Supabase client
 * writes the new session to cookies, but a soft navigation's RSC request can go
 * out before those cookies are attached — and may be served from Next's client
 * router cache. Middleware then sees the *old* auth state and redirects back to
 * the login route, which remounts on the code step with an already-consumed
 * code. (Reloading by hand appeared to "fix" it because a document request does
 * carry the cookies.)
 *
 * A hard navigation guarantees the request carries the fresh cookies and skips
 * the router cache entirely.
 */
export function navigateAfterAuth(path: string): void {
  window.location.assign(path);
}
