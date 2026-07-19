"use client";

import { useEffect, useState } from "react";

/**
 * "See it in your room" — Google model-viewer with AR.
 *
 * - Android: Scene Viewer (or WebXR) from the .glb
 * - iOS: Quick Look from the .usdz (ios-src) — required for iPhone/iPad
 * - Desktop: orbitable 3D preview
 *
 * The web component is imported client-side only (it touches window).
 */
export function ArViewer({
  glbUrl,
  usdzUrl,
  poster,
  alt,
}: {
  glbUrl: string;
  usdzUrl?: string | null;
  poster?: string | null;
  alt: string;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    import("@google/model-viewer").then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="rounded-2xl border bg-muted/30 p-4 sm:p-6">
      <h2 className="text-lg font-semibold">See it in your room</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        On your phone, tap the AR button to place a life-size model in your
        space.
      </p>
      <div className="mt-4 overflow-hidden rounded-xl bg-background">
        {ready ? (
          <model-viewer
            src={glbUrl}
            ios-src={usdzUrl ?? undefined}
            poster={poster ?? undefined}
            alt={alt}
            ar
            ar-modes="scene-viewer webxr quick-look"
            camera-controls
            auto-rotate
            shadow-intensity="1"
            style={{ width: "100%", height: "360px", display: "block" }}
          />
        ) : (
          <div
            className="flex h-[360px] items-center justify-center text-sm text-muted-foreground"
            aria-hidden
          >
            Loading 3D viewer…
          </div>
        )}
      </div>
      {!usdzUrl && (
        <p className="mt-2 text-xs text-muted-foreground">
          iPhone AR (Quick Look) needs a .usdz file — coming soon for this
          item.
        </p>
      )}
    </section>
  );
}
