"use client";

/* eslint-disable @next/next/no-img-element -- previews are blob object URLs */

import { useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { compressImage } from "@/lib/quote/image";
import type { ServiceWithQuestions } from "@/lib/quote/types";
import {
  addPhoto,
  getPhotos,
  removePhoto,
  type PendingPhoto,
} from "@/components/quote/photo-store";

function PhotoSilhouette() {
  return (
    <svg
      viewBox="0 0 120 90"
      className="h-16 w-auto text-muted-foreground/40"
      aria-hidden
    >
      <rect x="4" y="4" width="112" height="82" rx="6" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="6 4" />
      <circle cx="40" cy="34" r="10" fill="currentColor" />
      <path d="M16 74 L48 46 L68 62 L88 40 L104 74 Z" fill="currentColor" />
    </svg>
  );
}

function UploadCard({
  question,
  onChange,
}: {
  question: ServiceWithQuestions["service_questions"][number];
  onChange: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const photos = getPhotos(question.id);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      for (const file of Array.from(files).slice(0, 3 - photos.length)) {
        const blob = await compressImage(file);
        const photo: PendingPhoto = {
          blob,
          previewUrl: URL.createObjectURL(blob),
          originalName: file.name,
        };
        addPhoto(question.id, photo);
      }
      onChange();
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-xl border p-4">
      <p className="font-medium">{question.question_text}</p>
      {question.photo_guide_text && (
        <p className="mt-1 text-sm text-muted-foreground">
          {question.photo_guide_text}
        </p>
      )}

      {photos.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {photos.map((photo, i) => (
            <div key={photo.previewUrl} className="relative">
              <img
                src={photo.previewUrl}
                alt={`Photo ${i + 1}`}
                className="h-20 w-20 rounded-lg object-cover"
              />
              <button
                type="button"
                aria-label="Remove photo"
                onClick={() => {
                  removePhoto(question.id, i);
                  onChange();
                }}
                className="absolute -right-1.5 -top-1.5 rounded-full bg-foreground p-0.5 text-background"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3 flex justify-center rounded-lg bg-muted/50 py-4">
          <PhotoSilhouette />
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
      {photos.length < 3 && (
        <Button
          type="button"
          variant="outline"
          className="mt-3 w-full"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          <Camera />
          {busy
            ? "Processing…"
            : photos.length > 0
              ? "Add another photo"
              : "Take or choose a photo"}
        </Button>
      )}
    </div>
  );
}

export function StepPhotos({
  service,
  onBack,
  onNext,
}: {
  service: ServiceWithQuestions;
  onBack: () => void;
  onNext: () => void;
}) {
  const photoQuestions = service.service_questions.filter(
    (q) => q.requires_photo
  );
  const [, setVersion] = useState(0); // re-render when the photo store changes
  const [error, setError] = useState<string | null>(null);
  const [skip, setSkip] = useState(false);

  const missing = photoQuestions.filter((q) => getPhotos(q.id).length === 0);

  function handleNext() {
    if (missing.length > 0 && !skip) {
      setError(
        "Please add the requested photos — or tick “skip for now” and we’ll follow up."
      );
      return;
    }
    onNext();
  }

  if (photoQuestions.length === 0) {
    // No photos needed for this service — auto-advance UI.
    return (
      <div className="space-y-6">
        <h2 className="text-lg font-semibold">Photos</h2>
        <p className="text-sm text-muted-foreground">
          No photos needed for this service — you&apos;re ahead of schedule.
        </p>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
          <Button type="button" onClick={onNext} className="flex-1">
            Continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Add photos</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Photos help us confirm your quote — they upload securely when you
          submit. (They aren&apos;t kept if you refresh this page.)
        </p>
      </div>

      {photoQuestions.map((question) => (
        <UploadCard
          key={question.id}
          question={question}
          onChange={() => {
            setVersion((v) => v + 1);
            setError(null);
          }}
        />
      ))}

      {missing.length > 0 && (
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={skip}
            onChange={(e) => {
              setSkip(e.target.checked);
              setError(null);
            }}
            className="size-4"
          />
          Skip photos for now — I&apos;ll send them later
        </label>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button type="button" onClick={handleNext} className="flex-1">
          Continue
        </Button>
      </div>
    </div>
  );
}
