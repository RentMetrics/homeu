import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ['randomuser.me', 'images.unsplash.com', 'img.clerk.com'],
  },
  middleware: [
    './middleware.ts'
  ]
};

export default nextConfig;