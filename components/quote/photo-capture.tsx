"use client";

/* eslint-disable @next/next/no-img-element -- previews are blob object URLs */

import { useRef, useState } from "react";
import { Camera, ImagePlus, X } from "lucide-react";
import { compressImage } from "@/lib/quote/image";
import {
  addPhoto,
  getPhotos,
  removePhoto,
  type PendingPhoto,
} from "@/components/quote/photo-store";
import { cn } from "@/lib/utils";

const MAX_PHOTOS = 3;

/**
 * Inline photo capture, attached to the question it illustrates.
 *
 * Photos used to live on their own wizard step, which meant asking "what type
 * of wall?" and then, two screens later, "photo of the wall?" — the context
 * was gone by the time the camera opened. Here the prompt sits directly under
 * the answer it belongs to.
 */
export function PhotoCapture({
  questionId,
  guideText,
  onChange,
}: {
  questionId: string;
  guideText: string | null;
  onChange: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const photos = getPhotos(questionId);
  const full = photos.length >= MAX_PHOTOS;

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      for (const file of Array.from(files).slice(0, MAX_PHOTOS - photos.length)) {
        const blob = await compressImage(file);
        const photo: PendingPhoto = {
          blob,
          previewUrl: URL.createObjectURL(blob),
          originalName: file.name,
        };
        addPhoto(questionId, photo);
      }
      onChange();
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-dashed border-border bg-muted/30 p-3">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand ring-1 ring-brand/30">
          <Camera className="size-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">
            Add a photo{" "}
            <span className="font-normal text-muted-foreground">
              — it locks in your price
            </span>
          </p>
          {guideText && (
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              {guideText}
            </p>
          )}
        </div>
      </div>

      {photos.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {photos.map((photo, i) => (
            <div key={photo.previewUrl} className="group relative">
              <img
                src={photo.previewUrl}
                alt={`Photo ${i + 1}`}
                className="size-16 rounded-lg border border-border object-cover"
              />
              <button
                type="button"
                aria-label={`Remove photo ${i + 1}`}
                onClick={() => {
                  removePhoto(questionId, i);
                  onChange();
                }}
                className="absolute -right-1.5 -top-1.5 rounded-full bg-foreground p-0.5 text-background shadow-elev-1 transition-transform hover:scale-110"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />

      {!full && (
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium",
            "transition-colors hover:border-brand/50 hover:text-brand disabled:opacity-60"
          )}
        >
          <ImagePlus className="size-4" />
          {busy
            ? "Processing…"
            : photos.length > 0
              ? "Add another"
              : "Take or choose a photo"}
        </button>
      )}
    </div>
  );
}
