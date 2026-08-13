import { after } from "next/server";

/**
 * Run work after the response has been sent.
 *
 * **Not the same as dropping the promise.** On Vercel a serverless invocation
 * can be frozen the moment its response returns, so a bare un-awaited
 * `sendEmail(...)` is a silent coin flip over whether the customer hears from
 * us. `after()` tells the runtime to keep the invocation alive, which is what
 * makes this safe rather than merely fast.
 *
 * The win is real: an admin flipping a booking to Booked no longer waits on a
 * round trip to Resend before their dashboard updates.
 *
 * Outside a request scope — unit tests, scripts — `after()` throws, so we fall
 * back to running the work inline. Callers await either way and can't tell the
 * difference.
 */
export function runAfterResponse(work: () => Promise<void>): Promise<void> {
  const guarded = async () => {
    try {
      await work();
    } catch (err) {
      // Nothing upstream can catch this — the response is already gone.
      console.error("[email] background work failed", err);
    }
  };

  try {
    after(guarded);
    return Promise.resolve();
  } catch {
    return guarded();
  }
}
