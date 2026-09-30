import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the dev-only Next.js badge; it overlaps the app's corner UI on phones.
  devIndicators: false,
};

export default nextConfig;
