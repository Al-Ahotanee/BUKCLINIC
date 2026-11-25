import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Neon serverless driver and the embedded preview database must stay
  // outside the bundler (they ship their own binaries / WASM).
  serverExternalPackages: ["@electric-sql/pglite", "@neondatabase/serverless"],
};

export default nextConfig;
