import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://modern-home2.vercel.app";

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
