import type { Metadata, Viewport } from 'next';
import './globals.css';

// Force every page in the app to be dynamically rendered.
// Without this, Next.js builds a static HTML shell for 'use client' pages
// (login, otp-verify, etc.) even when force-dynamic is set on those pages,
// because the CLIENT component prerender is controlled at the layout level.
// Vercel's CDN then caches that shell and serves it (cache: HIT / PRERENDER)
// BEFORE the edge-middleware runs — so the middleware's auth check is bypassed
// entirely. Setting force-dynamic here is the single authoritative kill-switch.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'CommutePool — Verified Office Commutes',
  description: 'Find and share verified commute rides to Hyderabad IT corridors.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CommutePool',
  },
};

export const viewport: Viewport = {
  themeColor: '#1A56DB',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
