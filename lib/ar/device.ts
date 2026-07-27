/**
 * Is this an iPhone/iPad — i.e. can it launch AR Quick Look from a .usdz?
 *
 * Kept pure (no navigator access) so the decision is unit-testable; callers
 * pass the values in. iPadOS 13+ deliberately reports itself as "MacIntel" to
 * get desktop sites, so the only reliable tell is a Mac platform that also
 * reports touch points.
 */
export function isAppleMobile(
  userAgent: string,
  platform: string,
  maxTouchPoints: number
): boolean {
  if (/iPad|iPhone|iPod/.test(userAgent)) return true;
  return platform === "MacIntel" && maxTouchPoints > 1;
}
