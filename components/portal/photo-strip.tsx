/**
 * Thumbnails of the photos the customer uploaded with their enquiry.
 *
 * Plain `<img>` rather than next/image: these are short-lived signed URLs on a
 * private bucket, so there's nothing stable for the optimiser to cache.
 */
export function PhotoStrip({ urls }: { urls: string[] }) {
  if (!urls.length) return null;

  return (
    <ul className="flex flex-wrap gap-2">
      {urls.map((url, i) => (
        <li key={url}>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="block overflow-hidden rounded-lg border transition-colors hover:border-foreground/25"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`Photo ${i + 1} of your job`}
              loading="lazy"
              className="size-16 object-cover"
            />
          </a>
        </li>
      ))}
    </ul>
  );
}
