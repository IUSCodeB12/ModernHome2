"use client";

import { ThemeProvider as NextThemes } from "next-themes";

/**
 * Theme plumbing for the lights-on/lights-off switch.
 *
 * `next-themes` was already a dependency — the toast component reads from it —
 * but no provider was ever mounted, so `useTheme()` returned the default and
 * the `.dark` class was never applied to anything.
 *
 * `disableTransitionOnChange` is deliberately OFF. The whole point here is that
 * the light visibly sweeps in, so the colour transition is the feature rather
 * than the flicker to suppress.
 *
 * `defaultMode` comes from the published theme, so the admin decides what a
 * *first-time* visitor sees. It is only ever a default: next-themes reads
 * `storageKey` before paint, so anyone who has touched the light switch keeps
 * their own choice, and the switch itself is unchanged. That split is the whole
 * permission model for theming — an admin sets the site's look, a visitor picks
 * light or dark within it.
 */
export function ThemeProvider({
  children,
  defaultMode = "system",
}: {
  children: React.ReactNode;
  defaultMode?: "light" | "dark" | "system";
}) {
  return (
    <NextThemes
      attribute="class"
      defaultTheme={defaultMode}
      enableSystem
      storageKey="acestudio-lights"
    >
      {children}
    </NextThemes>
  );
}
