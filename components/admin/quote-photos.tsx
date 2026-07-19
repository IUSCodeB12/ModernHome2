"use client";

/* eslint-disable @next/next/no-img-element -- signed remote URLs / lightbox */

import { useState } from "react";
import { X } from "lucide-react";

export function QuotePhotos({
  paths,
  urls,
}: {
  paths: string[];
  urls: Record<string, string>;
}) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  if (!paths.length) {
    return (
      <p className="mt-2 text-sm text-muted-foreground">
        No photos were attached to this request.
      </p>
    );
  }

  return (
    <>
      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {paths.map((path) => {
          const url = urls[path];
          return (
            <button
              key={path}
              type="button"
              onClick={() => url && setLightbox(url)}
              className="aspect-square overflow-hidden rounded-lg border bg-muted"
            >
              {url ? (
                <img
                  src={url}
                  alt="Job photo"
                  className="h-full w-full object-cover transition-transform hover:scale-105"
                />
              ) : (
                <span className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  Preview unavailable
                </span>
              )}
            </button>
          );
        })}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white"
            onClick={() => setLightbox(null)}
          >
            <X className="size-5" />
          </button>
          <img
            src={lightbox}
            alt="Job photo enlarged"
            className="max-h-full max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
