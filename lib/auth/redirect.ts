/**
 * Guards the `?next=` redirect param against open-redirect attacks: only
 * same-origin relative paths (a single leading slash) are allowed.
 */
export function safeNext(
  next: string | null | undefined,
  fallback = "/portal"
): string {
  if (!next) return fallback;
  // Must be a rooted path.
  if (!next.startsWith("/")) return fallback;
  // Reject protocol-relative (`//evil.com`) and the backslash variants
  // (`/\evil.com`) that some browsers normalise to an origin.
  if (next.length > 1 && (next[1] === "/" || next[1] === "\\")) return fallback;
  // Reject whitespace / control chars (newline/tab smuggling past URL parsers).
  if (/\s/.test(next)) return fallback;
  return next;
}
