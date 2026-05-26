/** @type {import('next').NextConfig} */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://commutepool-api.onrender.com';

const nextConfig = {
  // Proxy all /api/* requests to the .NET backend on Render
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_BASE}/api/:path*`,
      },
    ];
  },

  // Belt-and-suspenders CDN kill-switch.
  // `export const dynamic = 'force-dynamic'` on a page stops Next.js from
  // *building* a prerender, but cannot evict a copy already sitting in
  // Vercel's CDN from a previous deploy. This headers() block sets
  // Cache-Control + Vary on every response at the framework level so the
  // edge never serves a stale prerendered page to a different cookie context.
  async headers() {
    return [
      {
        source: '/((?!_next/static|_next/image|favicon\.ico|icons|manifest\.json).*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
          { key: 'Vary',          value: 'Cookie' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
