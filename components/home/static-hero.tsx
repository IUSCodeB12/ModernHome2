/**
 * Static hero backdrop — the load fallback for the woven-light canvas and
 * the permanent hero on low-end / reduced-motion devices. A warm dark field
 * that the particles fade into seamlessly (no image → instant, LCP-friendly).
 */
export function StaticHero() {
  return (
    <div className="absolute inset-0 bg-[#141210]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,177,99,0.16),transparent_62%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(201,162,75,0.10),transparent_55%)]" />
    </div>
  );
}
