import type { NextConfig } from "next";

// Exported as static files so it can be published on GitHub Pages. Pages serves
// this app from a sub-path of the site, so asset URLs need that prefix; local
// dev and `next start` stay at the root.
const basePath = process.env.PAGES_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
