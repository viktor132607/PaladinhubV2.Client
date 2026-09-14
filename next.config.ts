import { readFileSync } from "node:fs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  env: process.env.SEO_SNAPSHOT_FILE ? {
    SEO_BUILD_SNAPSHOT_JSON: readFileSync(process.env.SEO_SNAPSHOT_FILE, "utf8"),
  } : {},
  trailingSlash: false,

  images: {
    unoptimized: true,
  },
};

export default nextConfig;
