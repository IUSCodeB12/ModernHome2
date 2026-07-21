"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  changeEmail,
  deleteAccount,
  updateProfile,
  type ActionState,
} from "@/app/(site)/portal/settings/actions";

type Profile = {
  full_name: string | null;
  phone: string | null;
  suburb: string | null;
  postcode: string | null;
};

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : children}
    </Button>
  );
}

function Feedback({ state }: { state: ActionState }) {
  if (!state) return null;
  return (
    <p
      className={`mt-3 text-sm ${state.error ? "text-red-600" : "text-green-600"}`}
      role="status"
    >
      {state.error ?? state.ok}
    </p>
  );
}

export function SettingsForm({
  email,
  profile,
}: {
  email: string;
  profile: Profile;
}) {
  const [profileState, profileAction] = useActionState(updateProfile, null);
  const [emailState, emailAction] = useActionState(changeEmail, null);
  const [deleteState, deleteAction] = useActionState(deleteAccount, null);

  return (
    <div className="space-y-8">
      {/* Profile */}
      <section className="rounded-2xl border bg-card p-6">
        <h2 className="font-serif text-xl">Your details</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Used to prefill quotes and contact you about jobs.
        </p>
        <form action={profileAction} className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" name="full_name" defaultValue={profile.full_name ?? ""} />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" type="tel" defaultValue={profile.phone ?? ""} />
          </div>
          <div>
            <Label htmlFor="postcode">Postcode</Label>
            <Input
              id="postcode"
              name="postcode"
              inputMode="numeric"
              defaultValue={profile.postcode ?? ""}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="suburb">Suburb</Label>
            <Input id="suburb" name="suburb" defaultValue={profile.suburb ?? ""} />
          </div>
          <div className="sm:col-span-2">
            <SubmitButton>Save changes</SubmitButton>
            <Feedback state={profileState} />
          </div>
        </form>
      </section>

      {/* Email */}
      <section className="rounded-2xl border bg-card p-6">
        <h2 className="font-serif text-xl">Email address</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          You sign in with this address. Changing it needs confirmation from the new inbox.
        </p>
        <form action={emailAction} className="mt-5 flex flex-wrap items-end gap-3">
          <div className="min-w-56 flex-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={email} required />
          </div>
          <SubmitButton>Update email</SubmitButton>
        </form>
        <Feedback state={emailState} />
      </section>

      {/* Danger zone */}
      <section className="rounded-2xl border border-red-200 bg-red-50/50 p-6">
        <h2 className="font-serif text-xl text-red-700">Delete account</h2>
        <p className="mt-1 text-sm text-red-700/80">
          Permanently removes your account and sign-in access. Booking records we&apos;re
          legally required to keep may be retained in de-identified form. This can&apos;t be undone.
        </p>
        <form
          action={deleteAction}
          className="mt-4"
          onSubmit={(e) => {
            if (
              !window.confirm(
                "Delete your account permanently? This cannot be undone."
              )
            ) {
              e.preventDefault();
            }
          }}
        >
          <Button type="submit" variant="destructive">
            Delete my account
          </Button>
          <Feedback state={deleteState} />
        </form>
      </section>
    </div>
  );
}
