"use client";

import { useEffect, useState } from "react";

/** Resend control with a visible countdown cooldown. */
export function ResendTimer({
  onResend,
  seconds = 60,
  disabled,
}: {
  onResend: () => void;
  seconds?: number;
  disabled?: boolean;
}) {
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  if (left > 0) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        Didn&apos;t get it? Resend in {left}s
        {left <= seconds - 30 && " · check your spam folder"}
      </p>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        onResend();
        setLeft(seconds);
      }}
      className="mx-auto block text-sm font-medium underline underline-offset-4 hover:text-foreground disabled:opacity-50"
    >
      Resend code
    </button>
  );
}
