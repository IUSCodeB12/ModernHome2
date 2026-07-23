"use client";

/* eslint-disable @next/next/no-img-element -- public bucket URLs */

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/quote/image";
import type { HeroSlideRow } from "@/lib/admin/hero-data";
import {
  addHeroSlide,
  deleteHeroSlide,
  reorderHeroSlides,
  toggleHeroSlide,
} from "@/app/(admin)/admin/(dashboard)/hero/actions";

export function HeroSlidesManager({
  initial,
  configured,
}: {
  initial: HeroSlideRow[];
  configured: boolean;
}) {
  const router = useRouter();
  const [slides, setSlides] = useState(initial);
  const [headline, setHeadline] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleAdd() {
    if (!configured) return toast.error("Connect Supabase to manage slides.");
    if (!file) return toast.error("Choose a photo first.");
    setUploading(true);
    try {
      const supabase = createClient();
      const blob = await compressImage(file, 2000, 0.82);
      const path = `hero/${crypto.randomUUID()}.jpg`;
      const { error } = await supabase.storage
        .from("gallery")
        .upload(path, blob, { contentType: "image/jpeg", upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("gallery").getPublicUrl(path);

      const res = await addHeroSlide({ imageUrl: data.publicUrl, headline: headline || undefined });
      if (!res.ok) throw new Error(res.error);
      toast.success("Slide added.");
      setHeadline("");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function remove(id: string) {
    setSlides((s) => s.filter((x) => x.id !== id));
    startTransition(async () => {
      const res = await deleteHeroSlide(id);
      if (res.ok) toast.success("Slide removed.");
      else {
        toast.error(res.error);
        router.refresh();
      }
    });
  }

  function toggle(id: string, active: boolean) {
    setSlides((s) => s.map((x) => (x.id === id ? { ...x, active } : x)));
    startTransition(async () => {
      const res = await toggleHeroSlide(id, active);
      if (!res.ok) {
        toast.error(res.error);
        router.refresh();
      }
    });
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= slides.length) return;
    const next = [...slides];
    [next[i], next[j]] = [next[j], next[i]];
    setSlides(next);
    startTransition(async () => {
      await reorderHeroSlides(next.map((s) => s.id));
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-4">
        <p className="text-sm font-medium">Add a slide</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Landscape interior photos work best (wide, well-lit). They rotate in the homepage hero.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm"
          />
          <Input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="Caption (optional)"
            className="w-56"
          />
          <Button onClick={handleAdd} disabled={uploading}>
            <Upload /> {uploading ? "Uploading…" : "Add slide"}
          </Button>
        </div>
      </div>

      {slides.length === 0 ? (
        <div className="rounded-xl border p-8 text-center text-sm text-muted-foreground">
          No slides yet. The hero falls back to the 3D room until you add photos.
        </div>
      ) : (
        <ul className="space-y-3">
          {slides.map((slide, i) => (
            <li
              key={slide.id}
              className="flex items-center gap-4 rounded-xl border bg-card p-3"
            >
              <img
                src={slide.image_url}
                alt={slide.headline ?? "Hero slide"}
                className="h-16 w-24 shrink-0 rounded-md object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {slide.headline || <span className="text-muted-foreground">No caption</span>}
                </p>
                <label className="mt-1 inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={slide.active}
                    onChange={(e) => toggle(slide.id, e.target.checked)}
                  />
                  {slide.active ? "Visible" : "Hidden"}
                </label>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
                  <ArrowUp className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => move(i, 1)} disabled={i === slides.length - 1} aria-label="Move down">
                  <ArrowDown className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => remove(slide.id)} aria-label="Delete" className="text-destructive">
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
