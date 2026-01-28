import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  crossOrigin: 'anonymous',
  env: {
    SOCKET_URL: process.env.SOCKET_URL,
    DATABASE_URL: process.env.DATABASE_URL,
  },
  /* config options here */
};

export default nextConfig;
