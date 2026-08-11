import type { MetadataRoute } from "next";
import { SITE_ORIGIN as siteUrl } from "@/lib/brand";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private / auth surfaces shouldn't be indexed.
      disallow: ["/admin", "/portal", "/auth", "/login", "/api"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
