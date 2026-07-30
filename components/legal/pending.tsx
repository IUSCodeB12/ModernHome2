/**
 * Visible marker for a business detail that hasn't been registered yet.
 *
 * Deliberately loud. These pages are contracts — a blank or a plausible dummy
 * value is how "ABN 00 000 000 000" ended up on real invoices. An obvious
 * annotation can't be published by accident without someone noticing.
 */
export function Pending({ children }: { children: string }) {
  return (
    <mark className="rounded bg-amber-100 px-1.5 py-0.5 text-[0.9em] font-medium text-amber-900 ring-1 ring-amber-200">
      [{children} — to be confirmed]
    </mark>
  );
}

/** Renders the real value once it exists, or a {@link Pending} marker until then. */
export function BusinessValue({
  value,
  label,
}: {
  value: string | null;
  label: string;
}) {
  return value ? <>{value}</> : <Pending>{label}</Pending>;
}
