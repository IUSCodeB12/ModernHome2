export default function ServiceLoading() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12">
      <div className="h-4 w-40 animate-pulse rounded bg-muted/70" />
      <div className="mt-4 flex items-end justify-between gap-4">
        <div className="space-y-3">
          <div className="h-9 w-64 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-80 max-w-full animate-pulse rounded bg-muted/70" />
        </div>
        <div className="h-10 w-28 animate-pulse rounded bg-muted" />
      </div>
      <div className="mt-10 h-44 w-full animate-pulse rounded-2xl bg-muted/60" />
    </div>
  );
}
