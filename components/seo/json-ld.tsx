/**
 * Renders a Schema.org JSON-LD object as a script tag. Server component —
 * safe to drop anywhere in a page; search engines read it, users don't see it.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
