import { dirname } from "path";
import { fileURLToPath } from "url";
import type { NextConfig } from "next";

const configDir = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  cleanDistDir: true,
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      }
    ]
  },
  typedRoutes: false,
  outputFileTracingRoot: configDir
};

export default nextConfig;
