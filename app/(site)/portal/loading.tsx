export default function PortalLoading() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      <div className="h-8 w-40 animate-pulse rounded-md bg-muted" />
      <div className="mt-2 h-4 w-64 animate-pulse rounded bg-muted/70" />
      <div className="mt-6 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-4">
            <div className="h-5 w-48 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-4 w-32 animate-pulse rounded bg-muted/70" />
            <div className="mt-2 h-4 w-40 animate-pulse rounded bg-muted/60" />
          </div>
        ))}
      </div>
    </div>
  );
}
