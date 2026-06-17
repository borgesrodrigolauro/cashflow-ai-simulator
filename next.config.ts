import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "prisma"],
  webpack: (config) => {
    config.externals.push({ canvas: "canvas" });
    return config;
  },
};

export default nextConfig;
