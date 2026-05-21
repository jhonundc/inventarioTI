import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: [
    'localhost',
    '.localhost',
    '127.0.0.1',
    ...(process.env.ALLOWED_DEV_ORIGINS ?? '').split(',').filter(Boolean),
  ],
};

export default nextConfig;
