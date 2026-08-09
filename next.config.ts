import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /*
     * Photos live in the public `gallery` Supabase bucket, so their URLs carry
     * the project ref as a subdomain — which differs between the local, preview
     * and production projects. Matching the wildcard keeps one config valid for
     * all three; the bucket is public and read-only, so there is nothing here a
     * narrower host would protect.
     */
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    /* The gallery's largest slot is ~760px on a 1152px page; 1920 covers it at
       2x DPR with room for the lightbox, which shows the full plate. */
    imageSizes: [96, 160, 256, 384, 512, 768],
  },
};

export default nextConfig;
