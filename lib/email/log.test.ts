import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { claimSend, recordResult } from "@/lib/email/log";
import { runAfterResponse } from "@/lib/email/background";

/**
 * The log is a safety mechanism, so its failure modes matter more than its
 * happy path. Two rules are load-bearing:
 *
 *   - a duplicate must be refused (that's the idempotency guarantee), and
 *   - every *other* problem must let the email through anyway.
 *
 * Getting the second one backwards would mean a broken audit table silently
 * stops customers hearing about their bookings.
 */

type Captured = { insert?: Record<string, unknown>; update?: Record<string, unknown> };

function fakeAdmin(opts: {
  insertError?: { code?: string; message?: string } | null;
  updateError?: { message: string } | null;
} = {}) {
  const captured: Captured = {};
  const client = {
    from: () => ({
      insert: (row: Record<string, unknown>) => {
        captured.insert = row;
        return {
          select: () => ({
            single: async () => ({
              data: opts.insertError ? null : { id: "log-1" },
              error: opts.insertError ?? null,
            }),
          }),
        };
      },
      update: (patch: Record<string, unknown>) => {
        captured.update = patch;
        return { eq: async () => ({ error: opts.updateError ?? null }) };
      },
    }),
  };
  return {
    admin: client as unknown as SupabaseClient<Database>,
    captured,
  };
}

const ENTRY = {
  template: "booking_confirmed" as const,
  recipient: "jo@example.com",
  dedupeKey: "booking_confirmed:b1:2026-08-19T23:00:00Z",
  bookingId: "b1",
};

describe("claimSend", () => {
  it("claims the send and returns the row to finalise", async () => {
    const { admin, captured } = fakeAdmin();
    const claim = await claimSend(admin, ENTRY);

    expect(claim).toEqual({ proceed: true, logId: "log-1" });
    // Reserved as pending — the row exists before Resend is contacted, which
    // is what makes the unique index a lock rather than a record.
    expect(captured.insert).toMatchObject({
      template: "booking_confirmed",
      recipient: "jo@example.com",
      status: "pending",
      dedupe_key: ENTRY.dedupeKey,
      booking_id: "b1",
    });
  });

  it("refuses a duplicate", async () => {
    // 23505 = unique_violation: another caller already reserved this key.
    const { admin } = fakeAdmin({ insertError: { code: "23505" } });
    expect(await claimSend(admin, ENTRY)).toEqual({ proceed: false, logId: null });
  });

  it("sends unlogged when the table does not exist yet", async () => {
    // 42P01 = undefined_table, i.e. the migration hasn't been pushed. The
    // email still has to go out.
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { admin } = fakeAdmin({ insertError: { code: "42P01" } });

    expect(await claimSend(admin, ENTRY)).toEqual({ proceed: true, logId: null });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("sends unlogged on any other database error", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const { admin } = fakeAdmin({ insertError: { code: "08006", message: "gone" } });

    expect(await claimSend(admin, ENTRY)).toEqual({ proceed: true, logId: null });
    err.mockRestore();
  });

  it("omits the dedupe key when the caller opts out", async () => {
    const { admin, captured } = fakeAdmin();
    await claimSend(admin, { template: "quote_ready", recipient: "a@b.com" });
    // Null rather than undefined: the partial unique index only ignores nulls.
    expect(captured.insert?.dedupe_key).toBeNull();
  });
});

describe("recordResult", () => {
  it("marks a real send as sent and keeps the key claimed", async () => {
    const { admin, captured } = fakeAdmin();
    await recordResult(admin, "log-1", { ok: true, id: "re_abc" });

    expect(captured.update).toMatchObject({ status: "sent", provider_id: "re_abc" });
    // The key must survive, or the next attempt would send a second copy.
    expect(captured.update).not.toHaveProperty("dedupe_key");
  });

  it("releases the key when the send failed", async () => {
    const { admin, captured } = fakeAdmin();
    await recordResult(admin, "log-1", { ok: false, error: "domain not verified" });

    expect(captured.update).toMatchObject({
      status: "failed",
      error: "domain not verified",
      dedupe_key: null,
    });
  });

  it("releases the key when the send was only stubbed", async () => {
    // Local dev has no RESEND_API_KEY. If a stub consumed the key, the first
    // real send in production would be suppressed as a duplicate.
    const { admin, captured } = fakeAdmin();
    await recordResult(admin, "log-1", { ok: true, skipped: true });

    expect(captured.update).toMatchObject({ status: "skipped", dedupe_key: null });
  });

  it("truncates a long provider error rather than failing the write", async () => {
    const { admin, captured } = fakeAdmin();
    await recordResult(admin, "log-1", { ok: false, error: "x".repeat(2000) });
    expect(String(captured.update?.error)).toHaveLength(500);
  });

  it("does nothing when there is no row to finalise", async () => {
    const { admin, captured } = fakeAdmin();
    await recordResult(admin, null, { ok: true, id: "re_abc" });
    expect(captured.update).toBeUndefined();
  });

  it("swallows a failed update", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const { admin } = fakeAdmin({ updateError: { message: "nope" } });
    await expect(
      recordResult(admin, "log-1", { ok: true, id: "re_abc" })
    ).resolves.toBeUndefined();
    err.mockRestore();
  });
});

describe("runAfterResponse", () => {
  it("runs the work inline when there is no request to defer past", async () => {
    // The path tests and scripts take: after() throws outside a request scope,
    // so the work must still happen rather than being dropped.
    const work = vi.fn(async () => {});
    await runAfterResponse(work);
    expect(work).toHaveBeenCalledOnce();
  });

  it("never lets background failures reach the caller", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      runAfterResponse(async () => {
        throw new Error("resend exploded");
      })
    ).resolves.toBeUndefined();
    expect(err).toHaveBeenCalled();
    err.mockRestore();
  });
});
