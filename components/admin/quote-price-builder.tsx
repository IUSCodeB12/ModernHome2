"use client";

import { useMemo } from "react";
import { LayoutTemplate, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { calcInvoiceTotals, normalizeLineItems, type LineItem } from "@/lib/invoice/calc";
import { CataloguePicker } from "@/components/admin/line-catalogue-picker";
import { templateForService, type PresetLine } from "@/lib/invoice/line-presets";
import { formatAud } from "@/lib/quote/estimate";
import { cn } from "@/lib/utils";

export type Draft = {
  description: string;
  quantity: string;
  unit_price_cents: string;
};

function toDraft(line: PresetLine | LineItem): Draft {
  return {
    description: line.description,
    quantity: String(line.quantity),
    unit_price_cents: (line.unit_price_cents / 100).toFixed(2),
  };
}

export function draftsToItems(items: Draft[]) {
  return items.map((it) => ({
    description: it.description,
    quantity: Number(it.quantity) || 0,
    unit_price_cents: Math.round((Number(it.unit_price_cents) || 0) * 100),
  }));
}

/**
 * Opening lines for the builder.
 *
 * A quote that's already been adjusted must come back with its own breakdown —
 * reopening the dialog used to reset to a single labour line, silently
 * discarding work the admin had already done. Otherwise start from the
 * service's template, and fall back to labour-at-the-midpoint when there
 * isn't one.
 */
export function initialDrafts(
  existing: LineItem[],
  serviceSlug: string | null,
  estimateMidpointCents: number
): Draft[] {
  if (existing.length > 0) return existing.map(toDraft);
  const template = templateForService(serviceSlug);
  if (template.length > 0) return template.map(toDraft);
  return [
    {
      description: "Labour & installation",
      quantity: "1",
      unit_price_cents: (estimateMidpointCents / 100).toFixed(2),
    },
  ];
}

export function QuotePriceBuilder({
  open,
  onOpenChange,
  items,
  setItems,
  serviceSlug,
  estimateMidpointCents,
  pending,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: Draft[];
  setItems: React.Dispatch<React.SetStateAction<Draft[]>>;
  serviceSlug: string | null;
  estimateMidpointCents: number;
  pending: boolean;
  onSave: () => void;
}) {
  const parsed = draftsToItems(items);
  const totals = calcInvoiceTotals(normalizeLineItems(parsed));
  const template = useMemo(
    () => templateForService(serviceSlug),
    [serviceSlug]
  );

  const variance = estimateMidpointCents
    ? totals.total_cents - estimateMidpointCents
    : 0;

  function patch(index: number, field: keyof Draft, value: string) {
    setItems((prev) =>
      prev.map((it, j) => (j === index ? { ...it, [field]: value } : it))
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adjust quote</DialogTitle>
          <DialogDescription>
            Build the final quote from line items. Prices are GST-inclusive —
            the 10% component is shown below, not added on top.
          </DialogDescription>
        </DialogHeader>

        {template.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() => setItems(template.map(toDraft))}
          >
            <LayoutTemplate /> Load standard breakdown
          </Button>
        )}

        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_4rem_6rem_5rem_2rem] gap-2 text-xs text-muted-foreground">
            <span>Description</span>
            <span>Qty</span>
            <span>Unit $</span>
            <span className="text-right">Line</span>
            <span />
          </div>
          {items.map((item, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_4rem_6rem_5rem_2rem] items-center gap-2"
            >
              <Input
                value={item.description}
                placeholder="Description"
                onChange={(e) => patch(i, "description", e.target.value)}
              />
              <Input
                type="number"
                min="0"
                step="0.5"
                value={item.quantity}
                onChange={(e) => patch(i, "quantity", e.target.value)}
              />
              <Input
                type="number"
                step="0.01"
                value={item.unit_price_cents}
                onChange={(e) => patch(i, "unit_price_cents", e.target.value)}
              />
              <span
                className={cn(
                  "text-right text-sm tabular-nums",
                  parsed[i].unit_price_cents < 0 && "text-destructive"
                )}
              >
                {formatAud(
                  Math.round(parsed[i].quantity * parsed[i].unit_price_cents)
                )}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={items.length === 1}
                onClick={() => setItems((prev) => prev.filter((_, j) => j !== i))}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setItems((prev) => [
                ...prev,
                { description: "", quantity: "1", unit_price_cents: "0.00" },
              ])
            }
          >
            <Plus /> Add blank line
          </Button>
        </div>

        <CataloguePicker
          onAdd={(line) => setItems((prev) => [...prev, toDraft(line)])}
        />

        <div className="space-y-1 rounded-lg bg-muted/50 p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal (ex GST)</span>
            <span className="tabular-nums">{formatAud(totals.subtotal_cents)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">GST (10%)</span>
            <span className="tabular-nums">{formatAud(totals.gst_cents)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{formatAud(totals.total_cents)}</span>
          </div>
          {estimateMidpointCents > 0 && (
            <div className="flex justify-between border-t border-border pt-1 text-xs">
              <span className="text-muted-foreground">
                vs auto-estimate ({formatAud(estimateMidpointCents)})
              </span>
              <span
                className={cn(
                  "tabular-nums",
                  variance > 0 ? "text-destructive" : "text-muted-foreground"
                )}
              >
                {variance === 0
                  ? "on the money"
                  : `${variance > 0 ? "+" : "−"}${formatAud(Math.abs(variance))}`}
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button onClick={onSave} disabled={pending || totals.total_cents <= 0}>
            Save &amp; send ({formatAud(totals.total_cents)})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
