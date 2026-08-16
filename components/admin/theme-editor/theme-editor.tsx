"use client";

import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Monitor, Moon, RotateCcw, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { PresetGrid } from "@/components/admin/theme-editor/preset-grid";
import { ThemeControls } from "@/components/admin/theme-editor/theme-controls";
import { ThemePreview } from "@/components/admin/theme-editor/theme-preview";
import { ThemeHistory } from "@/components/admin/theme-editor/theme-history";
import type { ThemeEditorData } from "@/lib/admin/theme-data";
import { deriveTheme } from "@/lib/theme/derive";
import { THEME_PRESETS } from "@/lib/theme/presets";
import { DEFAULT_THEME, type ThemeInput } from "@/lib/theme/tokens";
import { cn } from "@/lib/utils";
import {
  discardThemeDraft,
  publishTheme,
  rollbackTheme,
  saveThemeDraft,
} from "@/app/(admin)/admin/(dashboard)/settings/theme/actions";

/** Structural equality over the authored theme — the only state worth diffing. */
const same = (a: ThemeInput, b: ThemeInput) =>
  JSON.stringify(a) === JSON.stringify(b);

export function ThemeEditor({ data }: { data: ThemeEditorData }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // The draft is the working copy; the published theme is the starting point
  // when there isn't one.
  const [tokens, setTokens] = useState<ThemeInput>(data.draft ?? data.published);
  const [saved, setSaved] = useState<ThemeInput>(data.draft ?? data.published);
  const [mode, setMode] = useState<"light" | "dark">(
    data.published.defaultMode === "dark" ? "dark" : "light"
  );
  const [confirming, setConfirming] = useState(false);
  const [note, setNote] = useState("");

  const dirty = !same(tokens, saved);
  const unpublished = dirty || !same(tokens, data.published);

  /*
   * Deferred so dragging a colour slider never blocks the input. Derivation is
   * pure maths on twenty colours — cheap enough that this is belt-and-braces
   * rather than a fix for a measured stall, but it costs nothing and it is what
   * keeps the control responsive on a slow machine while the preview catches up.
   */
  const previewTokens = useDeferredValue(tokens);
  const derived = useMemo(() => deriveTheme(previewTokens), [previewTokens]);
  // Contrast badges read the *current* value, not the deferred one, so the
  // number under a colour field never lags the swatch above it.
  const live = useMemo(() => deriveTheme(tokens), [tokens]);

  const activePreset =
    THEME_PRESETS.find((preset) => same(preset.tokens, tokens))?.id ?? null;

  function patch(changes: Partial<ThemeInput>) {
    setTokens((current) => ({ ...current, ...changes }));
  }

  function run(
    fn: () => Promise<{ ok: boolean; error?: string }>,
    success: string,
    after?: () => void
  ) {
    startTransition(async () => {
      const result = await fn();
      if (result.ok) {
        toast.success(success);
        after?.();
        router.refresh();
      } else {
        toast.error(result.error ?? "Something went wrong.");
      }
    });
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col">
      <header className="flex flex-wrap items-center gap-3 border-b border-border pb-4">
        <div className="mr-auto">
          <h1 className="text-2xl font-bold tracking-tight">Website theme</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {dirty
              ? "Unsaved changes"
              : unpublished
                ? "Draft saved — not published yet"
                : `Live · version ${data.publishedVersion}`}
            {dirty && (
              <span className="ml-2 inline-block size-1.5 rounded-full bg-amber-500 align-middle" />
            )}
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => setTokens(DEFAULT_THEME)}
          title="Load the original house theme"
        >
          <RotateCcw /> Reset
        </Button>
        {data.draft && (
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() =>
              run(discardThemeDraft, "Draft discarded.", () => {
                setTokens(data.published);
                setSaved(data.published);
              })
            }
          >
            Discard draft
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          disabled={pending || !dirty}
          onClick={() =>
            run(() => saveThemeDraft(tokens), "Draft saved.", () =>
              setSaved(tokens)
            )
          }
        >
          Save draft
        </Button>
        <Button size="sm" disabled={pending} onClick={() => setConfirming(true)}>
          Publish
        </Button>
      </header>

      <div className="grid min-h-0 flex-1 gap-6 pt-5 lg:grid-cols-[360px_1fr]">
        <div className="min-h-0 space-y-6 overflow-y-auto pr-1">
          <section className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold">Start from a preset</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                A complete look in one click. Tweak anything afterwards.
              </p>
            </div>
            <PresetGrid active={activePreset} onPick={setTokens} />
          </section>

          <ThemeControls tokens={tokens} derived={live} onPatch={patch} />

          <ThemeHistory
            history={data.history}
            disabled={pending}
            onRollback={(id) =>
              run(() => rollbackTheme(id), "Loaded as a draft — publish to go live.", () =>
                router.refresh()
              )
            }
          />
        </div>

        {/* Preview */}
        <div className="flex min-h-0 flex-col">
          <div className="mb-2 flex items-center gap-2">
            <p className="mr-auto text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Preview
            </p>
            <div className="flex rounded-md border border-border p-0.5">
              {(
                [
                  ["light", Sun, "Light"],
                  ["dark", Moon, "Dark"],
                ] as const
              ).map(([value, Icon, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value)}
                  aria-pressed={mode === value}
                  className={cn(
                    "flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors",
                    mode === value
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="size-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-border shadow-sm">
            <ThemePreview theme={derived} mode={mode} />
          </div>

          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Monitor className="size-3.5" />
            Real components, live. Nothing here is published until you press
            Publish.
          </p>
        </div>
      </div>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish this theme?</DialogTitle>
            <DialogDescription>
              This restyles the public site for everyone, right away. The
              current live theme is kept so you can roll back.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <label htmlFor="publish-note" className="text-sm font-medium">
              What changed? <span className="text-muted-foreground">(optional)</span>
            </label>
            <Textarea
              id="publish-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Warmer palette for the spring campaign"
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button
              disabled={pending}
              onClick={() =>
                run(() => publishTheme(tokens, note), "Theme published.", () => {
                  setSaved(tokens);
                  setConfirming(false);
                  setNote("");
                })
              }
            >
              Publish now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
