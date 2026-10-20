import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

const nextConfig: NextConfig = {
  // Keep module resolution inside this project when the folder is copied.
  turbopack: { root: fileURLToPath(new URL(".", import.meta.url)) },
  // Allow isolated preview/build checks alongside the normal development server.
  distDir: process.env.JAGUAR_BUILD_DIR || ".next",
};

export default nextConfig;
