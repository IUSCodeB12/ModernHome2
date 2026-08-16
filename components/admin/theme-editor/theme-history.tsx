"use client";

import { History, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ThemeHistoryEntry } from "@/lib/admin/theme-data";

/**
 * Publish history, which doubles as the audit log — every row is a record of
 * who changed the site's appearance and when. Rolling back loads that version
 * as a *draft* rather than making it live, so getting back to a previous look
 * still goes through the same confirmation as any other publish.
 */
export function ThemeHistory({
  history,
  disabled,
  onRollback,
}: {
  history: ThemeHistoryEntry[];
  disabled: boolean;
  onRollback: (id: string) => void;
}) {
  if (history.length === 0) return null;

  return (
    <section className="space-y-3 border-t border-border pt-5">
      <div>
        <h3 className="flex items-center gap-1.5 text-sm font-semibold">
          <History className="size-4" />
          History
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Every publish, most recent first.
        </p>
      </div>

      <ol className="space-y-1">
        {history.map((entry, index) => (
          <li
            key={entry.id}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-accent/50"
          >
            <span className="font-mono tabular-nums text-muted-foreground">
              v{entry.version ?? "?"}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate">
                {entry.note ?? (index === 0 ? "Current" : "No note")}
              </span>
              <span className="block truncate text-muted-foreground">
                {new Date(entry.createdAt).toLocaleString("en-AU", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: "Australia/Melbourne",
                })}
                {entry.publishedBy && ` · ${entry.publishedBy}`}
              </span>
            </span>
            {index > 0 && (
              <Button
                variant="ghost"
                size="xs"
                disabled={disabled}
                onClick={() => onRollback(entry.id)}
                title="Load this version as a draft"
              >
                <Undo2 /> Restore
              </Button>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
