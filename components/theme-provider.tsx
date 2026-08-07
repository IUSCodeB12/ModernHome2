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
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemes
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="acestudio-lights"
    >
      {children}
    </NextThemes>
  );
}
