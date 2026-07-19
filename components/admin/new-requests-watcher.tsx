"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

/**
 * Subscribes to Supabase Realtime INSERTs on quote_requests so new customer
 * requests surface without a refresh. Requires the table to be in the
 * `supabase_realtime` publication (added in the realtime migration).
 */
export function NewRequestsWatcher() {
  const router = useRouter();
  const mountedAt = useRef(Date.now());

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("admin-new-quote-requests")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "quote_requests" },
        () => {
          // Ignore the brief backfill window right after mount.
          if (Date.now() - mountedAt.current < 1000) return;
          toast.info("New quote request received", {
            action: { label: "View", onClick: () => router.push("/admin/quotes") },
          });
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="relative flex size-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-green-500" />
      </span>
      Live
    </span>
  );
}
