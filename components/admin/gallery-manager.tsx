"use client";

/* eslint-disable @next/next/no-img-element -- gallery uses public bucket URLs */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Star, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { compressImage } from "@/lib/quote/image";
import { createClient } from "@/lib/supabase/client";
import {
  createGalleryItem,
  deleteGalleryItem,
  reorderGallery,
  toggleFeatured,
} from "@/app/(admin)/admin/(dashboard)/gallery/actions";
import type { Tables } from "@/lib/database.types";
import { cn } from "@/lib/utils";

type Item = Tables<"gallery_items">;
type Service = Pick<Tables<"services">, "id" | "name">;

const NO_SERVICE = "__none__";

function SortableCard({
  item,
  onToggleFeatured,
  onDelete,
}: {
  item: Item;
  onToggleFeatured: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("rounded-xl border p-2", isDragging && "opacity-50")}
    >
      <div className="mb-2 flex items-center justify-between">
        <button className="cursor-grab text-muted-foreground" {...attributes} {...listeners}>
          <GripVertical className="size-4" />
        </button>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleFeatured}
            title="Toggle featured"
          >
            <Star className={cn("size-4", item.featured && "fill-amber-400 text-amber-400")} />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete} title="Delete">
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1">
        <img src={item.before_image_url} alt="Before" className="aspect-square rounded object-cover" />
        {item.after_image_url ? (
          <img src={item.after_image_url} alt="After" className="aspect-square rounded object-cover" />
        ) : (
          <div className="flex aspect-square items-center justify-center rounded bg-muted text-xs text-muted-foreground">
            No after
          </div>
        )}
      </div>
      <p className="mt-1 truncate text-sm font-medium">{item.title}</p>
    </div>
  );
}

export function GalleryManager({
  items: initial,
  services,
  configured,
}: {
  items: Item[];
  services: Service[];
  configured: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);

  const [title, setTitle] = useState("");
  const [serviceId, setServiceId] = useState<string>(NO_SERVICE);
  const [before, setBefore] = useState<File | null>(null);
  const [after, setAfter] = useState<File | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  async function uploadOne(file: File): Promise<string> {
    const supabase = createClient();
    const blob = await compressImage(file, 1600, 0.8);
    const path = `${crypto.randomUUID()}.jpg`;
    const { error } = await supabase.storage.from("gallery").upload(path, blob, {
      contentType: "image/jpeg",
      upsert: false,
    });
    if (error) throw error;
    const { data } = supabase.storage.from("gallery").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleUpload() {
    if (!title || !before) {
      toast.error("Add a title and at least a 'before' photo.");
      return;
    }
    setUploading(true);
    try {
      const beforeUrl = await uploadOne(before);
      const afterUrl = after ? await uploadOne(after) : null;
      const res = await createGalleryItem({
        title,
        service_id: serviceId === NO_SERVICE ? null : serviceId,
        before_image_url: beforeUrl,
        after_image_url: afterUrl,
      });
      if (res.ok) {
        toast.success("Added to gallery.");
        setTitle("");
        setBefore(null);
        setAfter(null);
        setServiceId(NO_SERVICE);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    startTransition(async () => {
      const res = await reorderGallery({ orderedIds: next.map((i) => i.id) });
      if (!res.ok) {
        toast.error(res.error);
        setItems(items);
      }
    });
  }

  function handleToggleFeatured(item: Item) {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, featured: !i.featured } : i)));
    startTransition(async () => {
      const res = await toggleFeatured({ id: item.id, featured: !item.featured });
      if (res.ok) router.refresh();
      else toast.error(res.error);
    });
  }

  function handleDelete(item: Item) {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    startTransition(async () => {
      const res = await deleteGalleryItem({ id: item.id });
      if (res.ok) router.refresh();
      else toast.error(res.error);
    });
  }

  return (
    <div className="space-y-6">
      {/* Upload form */}
      <section className="rounded-xl border p-4">
        <h2 className="font-medium">Add before / after</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Kitchen LED upgrade" />
          </div>
          <div className="space-y-2">
            <Label>Service (optional)</Label>
            <Select value={serviceId} onValueChange={setServiceId} disabled={!configured}>
              <SelectTrigger>
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_SERVICE}>Unassigned</SelectItem>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Before photo</Label>
            <Input type="file" accept="image/*" onChange={(e) => setBefore(e.target.files?.[0] ?? null)} />
          </div>
          <div className="space-y-2">
            <Label>After photo (optional)</Label>
            <Input type="file" accept="image/*" onChange={(e) => setAfter(e.target.files?.[0] ?? null)} />
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <Button onClick={handleUpload} disabled={!configured || uploading}>
            <Upload /> {uploading ? "Uploading…" : "Upload"}
          </Button>
        </div>
      </section>

      {/* Grid */}
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No gallery items yet.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((item) => (
                <SortableCard
                  key={item.id}
                  item={item}
                  onToggleFeatured={() => handleToggleFeatured(item)}
                  onDelete={() => handleDelete(item)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
      {pending && <p className="text-xs text-muted-foreground">Saving…</p>}
    </div>
  );
}
