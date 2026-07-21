/**
 * Schema.org JSON-LD builders. Pure functions returning plain objects that
 * get serialised into <script type="application/ld+json">. No side effects.
 */
import type { ServiceWithQuestions } from "@/lib/quote/types";
import type { ServiceFaq } from "@/lib/services/content";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://modern-home2.vercel.app";

const BUSINESS = {
  name: "ModernHome",
  areaServed: "Greater Melbourne",
  region: "AU",
} as const;

/** LocalBusiness — describes the tradie business itself (site-wide). */
export function localBusinessLd() {
  return {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    name: BUSINESS.name,
    url: SITE_URL,
    image: `${SITE_URL}/opengraph-image`,
    areaServed: BUSINESS.areaServed,
    address: {
      "@type": "PostalAddress",
      addressRegion: "VIC",
      addressCountry: BUSINESS.region,
    },
    priceRange: "$$",
  };
}

/** Service — a single installable service, with its provider + area. */
export function serviceLd(service: ServiceWithQuestions) {
  const price = (service.base_price_cents ?? 0) / 100;
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    description:
      service.description ??
      `Fixed-price ${service.name} in ${BUSINESS.areaServed}, booked online.`,
    url: `${SITE_URL}/services/${service.slug}`,
    areaServed: BUSINESS.areaServed,
    provider: { "@type": "HomeAndConstructionBusiness", name: BUSINESS.name, url: SITE_URL },
    offers: {
      "@type": "Offer",
      price: price.toFixed(2),
      priceCurrency: "AUD",
      availability: "https://schema.org/InStock",
    },
  };
}

/** FAQPage — from a list of Q&A pairs. */
export function faqLd(faqs: ServiceFaq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

/** BreadcrumbList — a trail of { name, path } items (path relative to root). */
export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}
