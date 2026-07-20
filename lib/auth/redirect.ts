/**
 * Guards the `?next=` redirect param against open-redirect attacks: only
 * same-origin relative paths (a single leading slash) are allowed.
 */
export function safeNext(
  next: string | null | undefined,
  fallback = "/portal"
): string {
  if (!next) return fallback;
  // Reject protocol-relative (`//evil.com`), absolute URLs, and non-paths.
  if (!next.startsWith("/") || next.startsWith("//")) return fallback;
  return next;
}
