import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {},
  },
  turbopack: {},
  images: {
    remotePatterns: [
      { hostname: 'randomuser.me' },
      { hostname: 'images.unsplash.com' },
      { hostname: 'img.clerk.com' },
    ],
  },
  typescript: {
    // Full typecheck enforced — the codebase is at zero errors as of 2026-07-06.
    // If a build fails here, fix the type error; do not flip this back to true.
    ignoreBuildErrors: false,
  },
  serverExternalPackages: ['@workos-inc/node'],
  // Enhanced security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://clerk.homeu.co https://*.clerk.accounts.dev https://challenges.cloudflare.com https://js.stripe.com https://maps.googleapis.com https://plugin.argyle.com; worker-src 'self' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://*.clerk.accounts.dev https://clerk.homeu.co https://api.convex.cloud https://straddle.com https://api.straddle.com wss://*.convex.cloud https://maps.googleapis.com https://*.argyle.com https://api.awardco.com https://*.awardco.com; frame-src 'self' https://challenges.cloudflare.com https://js.stripe.com; object-src 'none'; base-uri 'self'; form-action 'self' https://homeu.awardco.com https://*.awardco.com; upgrade-insecure-requests;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
