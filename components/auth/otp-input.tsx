"use client";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";

/** Six-box one-time-code field: numeric keyboard, paste, auto-submit. */
export function OtpInput({
  value,
  onChange,
  onComplete,
  disabled,
  invalid,
}: {
  value: string;
  onChange: (v: string) => void;
  onComplete?: (v: string) => void;
  disabled?: boolean;
  invalid?: boolean;
}) {
  return (
    <InputOTP
      maxLength={6}
      value={value}
      onChange={onChange}
      onComplete={onComplete}
      disabled={disabled}
      inputMode="numeric"
      autoComplete="one-time-code"
      autoFocus
      containerClassName={cn(invalid && "animate-[shake_0.3s]")}
    >
      <InputOTPGroup className="gap-2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <InputOTPSlot
            key={i}
            index={i}
            className={cn(
              "size-12 rounded-lg border text-lg shadow-none",
              invalid && "border-destructive"
            )}
          />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
}
