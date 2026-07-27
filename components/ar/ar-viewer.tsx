"use client";

/* eslint-disable @next/next/no-img-element -- public bucket URLs, no next/image domain config */

import { useEffect, useState } from "react";
import { Smartphone } from "lucide-react";
import { isAppleMobile as detectAppleMobile } from "@/lib/ar/device";

/**
 * "See it in your room" — AR preview for a service.
 *
 * Two paths, depending on which models the tradie has uploaded:
 *
 * - With a .glb: Google model-viewer. Orbitable 3D on desktop, Scene Viewer /
 *   WebXR on Android, and Quick Look on iOS via `ios-src` when a .usdz exists.
 * - With only a .usdz: iOS Quick Look directly, through an `<a rel="ar">`.
 *   model-viewer can't help here — it needs `src` (the .glb) to render
 *   anything — so rather than hide the model entirely we surface it on the
 *   devices that can show it, and show the poster elsewhere.
 */
export function ArViewer({
  glbUrl,
  usdzUrl,
  poster,
  alt,
}: {
  glbUrl?: string | null;
  usdzUrl?: string | null;
  poster?: string | null;
  alt: string;
}) {
  if (glbUrl) {
    return (
      <ArShell>
        <ModelViewer glbUrl={glbUrl} usdzUrl={usdzUrl} poster={poster} alt={alt} />
        {!usdzUrl && (
          <p className="mt-2 text-xs text-muted-foreground">
            iPhone AR (Quick Look) needs a .usdz file — coming soon for this
            item.
          </p>
        )}
      </ArShell>
    );
  }

  if (usdzUrl) {
    return (
      <ArShell>
        <QuickLookOnly usdzUrl={usdzUrl} poster={poster} alt={alt} />
      </ArShell>
    );
  }

  return null;
}

function ArShell({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-muted/30 p-4 sm:p-6">
      <h2 className="text-lg font-semibold">See it in your room</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        On your phone, tap the AR button to place a life-size model in your
        space.
      </p>
      {children}
    </section>
  );
}

function ModelViewer({
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
    // Client-side only — the web component touches window.
    import("@google/model-viewer").then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
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
  );
}

/**
 * .usdz with no .glb. Safari on iOS/iPadOS turns an `<a rel="ar">` wrapping a
 * single `<img>` into a Quick Look launcher; every other browser just gets the
 * poster, since there's nothing it could render.
 */
function QuickLookOnly({
  usdzUrl,
  poster,
  alt,
}: {
  usdzUrl: string;
  poster?: string | null;
  alt: string;
}) {
  const [isAppleMobile, setIsAppleMobile] = useState(false);

  useEffect(() => {
    setIsAppleMobile(
      detectAppleMobile(
        navigator.userAgent,
        navigator.platform,
        navigator.maxTouchPoints
      )
    );
  }, []);

  const frame =
    "mt-4 flex h-[280px] items-center justify-center overflow-hidden rounded-xl border bg-background";

  if (!isAppleMobile) {
    return (
      <>
        <div className={frame}>
          {poster ? (
            <img src={poster} alt={alt} className="size-full object-cover" />
          ) : (
            <Smartphone className="size-10 text-muted-foreground/40" aria-hidden />
          )}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Open this page on an iPhone or iPad to place it in your room.
        </p>
      </>
    );
  }

  return (
    <>
      {/* Quick Look requires the anchor's only child to be an <img>. */}
      <a rel="ar" href={usdzUrl} className={frame} aria-label={`View ${alt} in AR`}>
        <img
          src={poster ?? "/ar-quick-look.svg"}
          alt={alt}
          className="size-full object-cover"
        />
      </a>
      <p className="mt-3 text-sm font-medium">
        Tap the image to place it in your room.
      </p>
    </>
  );
}
