/**
 * The catch-all "Custom job" service.
 *
 * It's a real `services` row (quote_requests.service_id is NOT NULL, so it has
 * to be) but it carries no price: base_price_cents is 0 and there's no
 * auto-estimate. Everywhere that would otherwise render a price or compute one
 * has to branch on this — hence a single shared predicate rather than slug
 * comparisons scattered across the wizard, the services index and the admin.
 */
export const CUSTOM_SERVICE_SLUG = "custom-job";

export function isCustomService(service: { slug: string } | null | undefined) {
  return service?.slug === CUSTOM_SERVICE_SLUG;
}
