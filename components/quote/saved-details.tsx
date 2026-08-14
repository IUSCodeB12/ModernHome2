"use client";

import { ArrowRight, MapPin, Pencil, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ContactDetails } from "@/lib/quote/wizard-state";

function SavedRow({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5 py-2">
      <span className="mt-0.5 shrink-0 text-brand">{icon}</span>
      <div className="min-w-0 text-sm">{children}</div>
    </div>
  );
}

/**
 * One-tap checkout for a returning customer.
 *
 * Their details are already on file — the submit action writes them back on
 * every booking — so a repeat customer should be confirming an address, not
 * retyping one.
 */
export function SavedDetails({
  saved,
  onUse,
  onEdit,
  onBack,
}: {
  saved: ContactDetails;
  onUse: () => void;
  onEdit: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-2xl tracking-tight">Welcome back</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Still the same details? One tap and you&apos;re at the last step.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-elev-1 sm:p-5">
        <div className="divide-y divide-border">
          <SavedRow icon={<UserRound className="size-4" />}>
            <p className="font-medium">{saved.fullName}</p>
            <p className="text-muted-foreground">
              {saved.phone} · {saved.email}
            </p>
          </SavedRow>
          <SavedRow icon={<MapPin className="size-4" />}>
            <p className="font-medium">{saved.addressLine1}</p>
            <p className="text-muted-foreground">
              {saved.suburb} {saved.postcode}
            </p>
            {saved.accessNotes && (
              <p className="mt-1 text-muted-foreground">{saved.accessNotes}</p>
            )}
          </SavedRow>
        </div>

        <Button type="button" onClick={onUse} className="mt-4 w-full">
          Use these details <ArrowRight />
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onEdit}
          className="mt-2 w-full"
        >
          <Pencil /> Somewhere else this time
        </Button>
      </div>

      <Button type="button" variant="outline" onClick={onBack} className="w-full">
        Back
      </Button>
    </div>
  );
}
