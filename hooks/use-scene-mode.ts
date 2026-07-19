"use client";

import { useEffect, useState } from "react";

export type SceneMode = "pending" | "3d" | "static";

/**
 * Decides whether a device should run the heavy WebGL experiences.
 * Low core count or a reduced-motion preference → static fallback.
 * Returns "pending" until mounted so SSR and first paint stay static.
 */
export function useSceneMode(): SceneMode {
  const [mode, setMode] = useState<SceneMode>("pending");
  useEffect(() => {
    const lowEnd =
      (navigator.hardwareConcurrency ?? 8) < 4 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setMode(lowEnd ? "static" : "3d");
  }, []);
  return mode;
}
