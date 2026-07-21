import type { MetadataRoute } from "next";
import { getActiveServices } from "@/lib/services-data";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://modern-home2.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/services`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/gallery`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/quote`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
  ];

  let serviceRoutes: MetadataRoute.Sitemap = [];
  try {
    const services = await getActiveServices();
    serviceRoutes = services.map((s) => ({
      url: `${siteUrl}/services/${s.slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    }));
  } catch {
    // Supabase unavailable at build — ship the static routes only.
  }

  return [...staticRoutes, ...serviceRoutes];
}
