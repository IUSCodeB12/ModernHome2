"use client";

/* eslint-disable @next/next/no-img-element -- public bucket URLs */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/quote/image";
import type { ShowcaseRow, ShowcaseServiceOption } from "@/lib/admin/showcase-data";
import {
  addShowcasePanel,
  deleteShowcasePanel,
  reorderShowcasePanels,
  toggleShowcasePanel,
  updateShowcasePanel,
} from "@/app/(admin)/admin/(dashboard)/showcase/actions";

export function ShowcaseManager({
  initial,
  services,
  configured,
}: {
  initial: ShowcaseRow[];
  services: ShowcaseServiceOption[];
  configured: boolean;
}) {
  const router = useRouter();
  const [panels, setPanels] = useState(initial);
  const [, startTransition] = useTransition();

  function patch(id: string, changes: Partial<ShowcaseRow>) {
    setPanels((ps) => ps.map((p) => (p.id === id ? { ...p, ...changes } : p)));
  }

  async function save(panel: ShowcaseRow) {
    if (!configured) return toast.error("Connect Supabase to manage panels.");
    const res = await updateShowcasePanel({
      id: panel.id,
      serviceId: panel.service_id,
      imageUrl: panel.image_url,
      eyebrow: panel.eyebrow,
      title: panel.title,
      body: panel.body,
      priceHint: panel.price_hint,
    });
    if (res.ok) toast.success("Panel saved.");
    else toast.error(res.error);
  }

  async function upload(panel: ShowcaseRow, file: File) {
    if (!configured) return toast.error("Connect Supabase to upload photos.");
    try {
      const supabase = createClient();
      const blob = await compressImage(file, 2000, 0.82);
      const path = `showcase/${crypto.randomUUID()}.jpg`;
      const { error } = await supabase.storage
        .from("gallery")
        .upload(path, blob, { contentType: "image/jpeg", upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("gallery").getPublicUrl(path);
      patch(panel.id, { image_url: data.publicUrl });
      const res = await updateShowcasePanel({
        id: panel.id,
        serviceId: panel.service_id,
        imageUrl: data.publicUrl,
        eyebrow: panel.eyebrow,
        title: panel.title,
        body: panel.body,
        priceHint: panel.price_hint,
      });
      if (!res.ok) throw new Error(res.error);
      toast.success("Photo updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    }
  }

  function remove(id: string) {
    setPanels((ps) => ps.filter((p) => p.id !== id));
    startTransition(async () => {
      const res = await deleteShowcasePanel(id);
      if (res.ok) toast.success("Panel removed.");
      else {
        toast.error(res.error);
        router.refresh();
      }
    });
  }

  function toggle(id: string, active: boolean) {
    patch(id, { active });
    startTransition(async () => {
      const res = await toggleShowcasePanel(id, active);
      if (!res.ok) {
        toast.error(res.error);
        router.refresh();
      }
    });
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= panels.length) return;
    const next = [...panels];
    [next[i], next[j]] = [next[j], next[i]];
    setPanels(next);
    startTransition(async () => {
      await reorderShowcasePanels(next.map((p) => p.id));
    });
  }

  function add() {
    startTransition(async () => {
      const res = await addShowcasePanel();
      if (res.ok) router.refresh();
      else toast.error(res.error);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 rounded-xl border bg-card p-4">
        <p className="text-sm text-muted-foreground">
          Each panel is one service on the homepage. The photo is pinned while
          its copy scrolls past — use a tall, well-lit shot of real work.
        </p>
        <Button onClick={add} variant="outline" className="shrink-0">
          <Plus /> Add panel
        </Button>
      </div>

      {panels.length === 0 ? (
        <div className="rounded-xl border p-8 text-center text-sm text-muted-foreground">
          No panels yet. Add one to start the homepage showcase.
        </div>
      ) : (
        <ul className="space-y-4">
          {panels.map((panel, i) => (
            <li key={panel.id} className="rounded-xl border bg-card p-4">
              <div className="flex gap-4">
                <div className="w-32 shrink-0">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-md border bg-muted">
                    {panel.image_url ? (
                      <img
                        src={panel.image_url}
                        alt={panel.title}
                        className="size-full object-cover"
                      />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-center text-xs text-muted-foreground">
                        No photo
                      </span>
                    )}
                  </div>
                  <label className="mt-2 flex cursor-pointer items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-xs hover:bg-accent">
                    <Upload className="size-3.5" />
                    {panel.image_url ? "Replace" : "Upload"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) upload(panel, f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>

                <div className="min-w-0 flex-1 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Eyebrow</Label>
                      <Input
                        value={panel.eyebrow ?? ""}
                        onChange={(e) => patch(panel.id, { eyebrow: e.target.value })}
                        placeholder="TV Wall Mounting"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Price hint</Label>
                      <Input
                        value={panel.price_hint ?? ""}
                        onChange={(e) => patch(panel.id, { price_hint: e.target.value })}
                        placeholder="from $149"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Title</Label>
                    <Input
                      value={panel.title}
                      onChange={(e) => patch(panel.id, { title: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Body</Label>
                    <textarea
                      value={panel.body ?? ""}
                      onChange={(e) => patch(panel.id, { body: e.target.value })}
                      rows={2}
                      className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="flex flex-wrap items-end gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Links to service</Label>
                      <select
                        value={panel.service_id ?? ""}
                        onChange={(e) =>
                          patch(panel.id, { service_id: e.target.value || null })
                        }
                        className="h-9 rounded-md border bg-transparent px-3 text-sm"
                      >
                        <option value="">No CTA</option>
                        {services.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button onClick={() => save(panel)}>Save</Button>
                    <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={panel.active}
                        onChange={(e) => toggle(panel.id, e.target.checked)}
                      />
                      {panel.active ? "Visible" : "Hidden"}
                    </label>
                    <div className="ml-auto flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
                        <ArrowUp className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => move(i, 1)} disabled={i === panels.length - 1} aria-label="Move down">
                        <ArrowDown className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(panel.id)} aria-label="Delete" className="text-destructive">
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
