"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addAvailabilityRule,
  blockDate,
  deleteAvailabilityRule,
  unblockDate,
} from "@/app/(admin)/admin/(dashboard)/calendar/actions";
import type { Tables } from "@/lib/database.types";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function AvailabilityManager({
  rules,
  blocked,
}: {
  rules: Tables<"availability_rules">[];
  blocked: Tables<"blocked_dates">[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [day, setDay] = useState("1");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");

  const [blockDay, setBlockDay] = useState("");
  const [blockReason, setBlockReason] = useState("");

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(success);
        router.refresh();
      } else {
        toast.error(res.error ?? "Something went wrong.");
      }
    });
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Working hours */}
      <section className="rounded-xl border p-4">
        <h2 className="font-medium">Working hours</h2>
        <p className="text-sm text-muted-foreground">
          Slots are generated from these weekly rules.
        </p>

        <div className="mt-3 space-y-1">
          {rules.length === 0 && (
            <p className="text-sm text-muted-foreground">No hours set yet.</p>
          )}
          {rules.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-lg border px-3 py-1.5 text-sm"
            >
              <span>
                <span className="font-medium">{DAYS[r.day_of_week]}</span>{" "}
                {r.start_time.slice(0, 5)}–{r.end_time.slice(0, 5)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                disabled={pending}
                onClick={() => run(() => deleteAvailabilityRule({ id: r.id }), "Removed.")}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-end gap-2">
          <Select value={day} onValueChange={setDay}>
            <SelectTrigger size="sm" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DAYS.map((d, i) => (
                <SelectItem key={i} value={String(i)}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="w-28" />
          <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="w-28" />
          <Button
            size="sm"
            disabled={pending}
            onClick={() =>
              run(
                () => addAvailabilityRule({ day_of_week: Number(day), start_time: start, end_time: end }),
                "Hours added."
              )
            }
          >
            <Plus /> Add
          </Button>
        </div>
      </section>

      {/* Blocked dates */}
      <section className="rounded-xl border p-4">
        <h2 className="font-medium">Blocked days</h2>
        <p className="text-sm text-muted-foreground">
          Block holidays or days off — no slots will be offered.
        </p>

        <div className="mt-3 space-y-1">
          {blocked.length === 0 && (
            <p className="text-sm text-muted-foreground">Nothing blocked.</p>
          )}
          {blocked.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between rounded-lg border px-3 py-1.5 text-sm"
            >
              <span>
                <span className="font-medium">{b.date}</span>
                {b.reason ? ` — ${b.reason}` : ""}
              </span>
              <Button
                variant="ghost"
                size="icon"
                disabled={pending}
                onClick={() => run(() => unblockDate({ id: b.id }), "Unblocked.")}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-end gap-2">
          <Input
            type="date"
            value={blockDay}
            onChange={(e) => setBlockDay(e.target.value)}
            className="w-40"
          />
          <Input
            placeholder="Reason (optional)"
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            className="w-40"
          />
          <Button
            size="sm"
            disabled={pending || !blockDay}
            onClick={() =>
              run(() => blockDate({ date: blockDay, reason: blockReason }), "Day blocked.")
            }
          >
            <Plus /> Block
          </Button>
        </div>
      </section>
    </div>
  );
}
