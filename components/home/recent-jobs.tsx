import { MapPin } from "lucide-react";
import type { RecentJob } from "@/lib/home-data";

/**
 * Slow marquee of recently completed jobs. Duplicated inline so the loop is
 * seamless; pauses under prefers-reduced-motion (see globals.css).
 */
export function RecentJobs({ jobs }: { jobs: RecentJob[] }) {
  if (jobs.length === 0) return null;
  const loop = [...jobs, ...jobs];

  return (
    <section className="border-y bg-muted/30 py-6">
      <p className="mb-3 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
        Freshly completed
      </p>
      <div className="group relative overflow-hidden">
        {/* edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent" />
        <div className="flex w-max animate-marquee gap-3">
          {loop.map((job, i) => (
            <span
              key={`${job.id}-${i}`}
              className="flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm"
            >
              <span className="font-medium">{job.service}</span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="size-3.5" />
                {job.suburb}
              </span>
              <span className="text-muted-foreground">· {job.when}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
