"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatAud, parseOptions } from "@/lib/quote/estimate";
import { createClient } from "@/lib/supabase/client";
import {
  updateQuestion,
  updateService,
} from "@/app/(admin)/admin/(dashboard)/services/actions";
import type { ServiceWithQuestions } from "@/lib/quote/types";
import type { Tables } from "@/lib/database.types";

type OptionDraft = {
  label: string;
  value: string;
  price_modifier_cents: string;
  price_modifier_pct: string;
};

function QuestionRow({ question }: { question: Tables<"service_questions"> }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [text, setText] = useState(question.question_text);
  const [options, setOptions] = useState<OptionDraft[]>(
    parseOptions(question.options).map((o) => ({
      label: o.label,
      value: o.value,
      price_modifier_cents: o.price_modifier_cents != null ? (o.price_modifier_cents / 100).toFixed(2) : "",
      price_modifier_pct: o.price_modifier_pct != null ? String(o.price_modifier_pct) : "",
    }))
  );

  function save() {
    startTransition(async () => {
      const res = await updateQuestion({
        id: question.id,
        question_text: text,
        options: options.map((o) => ({
          label: o.label,
          value: o.value,
          price_modifier_cents:
            o.price_modifier_cents === "" ? null : Math.round(Number(o.price_modifier_cents) * 100),
          price_modifier_pct: o.price_modifier_pct === "" ? null : Number(o.price_modifier_pct),
        })),
      });
      if (res.ok) {
        toast.success("Question updated.");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center gap-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} className="flex-1" />
        <span className="whitespace-nowrap text-xs text-muted-foreground">{question.input_type}</span>
      </div>

      {options.length > 0 && (
        <div className="mt-2 space-y-1.5">
          <div className="grid grid-cols-[1fr_5rem_5rem] gap-2 text-xs text-muted-foreground">
            <span>Option label</span>
            <span>+/- $</span>
            <span>+/- %</span>
          </div>
          {options.map((opt, i) => (
            <div key={i} className="grid grid-cols-[1fr_5rem_5rem] gap-2">
              <Input
                value={opt.label}
                onChange={(e) =>
                  setOptions((prev) => prev.map((o, j) => (j === i ? { ...o, label: e.target.value } : o)))
                }
              />
              <Input
                type="number"
                step="0.01"
                placeholder="—"
                value={opt.price_modifier_cents}
                onChange={(e) =>
                  setOptions((prev) =>
                    prev.map((o, j) => (j === i ? { ...o, price_modifier_cents: e.target.value } : o))
                  )
                }
              />
              <Input
                type="number"
                step="1"
                placeholder="—"
                value={opt.price_modifier_pct}
                onChange={(e) =>
                  setOptions((prev) =>
                    prev.map((o, j) => (j === i ? { ...o, price_modifier_pct: e.target.value } : o))
                  )
                }
              />
            </div>
          ))}
        </div>
      )}

      <div className="mt-2 flex justify-end">
        <Button size="sm" variant="outline" onClick={save} disabled={pending}>
          Save question
        </Button>
      </div>
    </div>
  );
}

export function ServiceEditor({ service }: { service: ServiceWithQuestions }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const [name, setName] = useState(service.name);
  const [description, setDescription] = useState(service.description ?? "");
  const [basePrice, setBasePrice] = useState((service.base_price_cents / 100).toFixed(2));
  const [priceUnit, setPriceUnit] = useState(service.price_unit);
  const [active, setActive] = useState(service.active);
  const [sortOrder, setSortOrder] = useState(String(service.sort_order));
  const [arGlbUrl, setArGlbUrl] = useState(service.ar_model_glb_url ?? "");
  const [arUsdzUrl, setArUsdzUrl] = useState(service.ar_model_usdz_url ?? "");
  const [uploadingAr, setUploadingAr] = useState<"glb" | "usdz" | null>(null);

  async function uploadArFile(kind: "glb" | "usdz", file: File) {
    setUploadingAr(kind);
    try {
      const supabase = createClient();
      const path = `${service.slug}/${service.slug}.${kind}`;
      const { error } = await supabase.storage.from("models").upload(path, file, {
        contentType: kind === "glb" ? "model/gltf-binary" : "model/vnd.usdz+zip",
        upsert: true,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("models").getPublicUrl(path);
      if (kind === "glb") setArGlbUrl(data.publicUrl);
      else setArUsdzUrl(data.publicUrl);
      toast.success(`.${kind} uploaded — hit "Save service" to publish it.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploadingAr(null);
    }
  }

  function saveService() {
    startTransition(async () => {
      const res = await updateService({
        id: service.id,
        name,
        description,
        base_price_cents: Math.round(Number(basePrice) * 100),
        price_unit: priceUnit,
        active,
        sort_order: Number(sortOrder),
        ar_model_glb_url: arGlbUrl || null,
        ar_model_usdz_url: arUsdzUrl || null,
      });
      if (res.ok) {
        toast.success("Service saved.");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="rounded-xl border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <div>
          <span className="font-medium">{service.name}</span>
          <span className="ml-2 text-sm text-muted-foreground">
            from {formatAud(service.base_price_cents)}
            {service.price_unit !== "fixed" && ` / ${service.price_unit.replace("per_", "")}`}
            {!service.active && " · inactive"}
          </span>
        </div>
        {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
      </button>

      {open && (
        <div className="space-y-4 border-t p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Base price ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Price unit</Label>
              <Select value={priceUnit} onValueChange={(v) => setPriceUnit(v as typeof priceUnit)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed</SelectItem>
                  <SelectItem value="per_metre">Per metre</SelectItem>
                  <SelectItem value="per_hour">Per hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sort order</Label>
              <Input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Switch checked={active} onCheckedChange={setActive} id={`active-${service.id}`} />
              <Label htmlFor={`active-${service.id}`}>Active</Label>
            </div>
          </div>

          {/* AR models */}
          <div className="space-y-3 rounded-lg border p-3">
            <div>
              <h3 className="text-sm font-medium">AR models</h3>
              <p className="text-xs text-muted-foreground">
                Upload a .glb (Android/desktop) and .usdz (iPhone Quick Look) to
                enable &ldquo;See it in your room&rdquo; on the service page.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>.glb file</Label>
                <Input
                  type="file"
                  accept=".glb,model/gltf-binary"
                  disabled={uploadingAr !== null}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadArFile("glb", f);
                  }}
                />
                <Input
                  value={arGlbUrl}
                  onChange={(e) => setArGlbUrl(e.target.value)}
                  placeholder="…or paste a URL"
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label>.usdz file (iOS)</Label>
                <Input
                  type="file"
                  accept=".usdz"
                  disabled={uploadingAr !== null}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadArFile("usdz", f);
                  }}
                />
                <Input
                  value={arUsdzUrl}
                  onChange={(e) => setArUsdzUrl(e.target.value)}
                  placeholder="…or paste a URL"
                  className="text-xs"
                />
              </div>
            </div>
            {uploadingAr && (
              <p className="text-xs text-muted-foreground">Uploading .{uploadingAr}…</p>
            )}
          </div>

          <div className="flex justify-end">
            <Button onClick={saveService} disabled={pending}>
              Save service
            </Button>
          </div>

          {service.service_questions.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Questions &amp; pricing modifiers</h3>
              {service.service_questions.map((q) => (
                <QuestionRow key={q.id} question={q} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
