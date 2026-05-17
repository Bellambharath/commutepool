import type { Metadata, Viewport } from 'next';
import './globals.css';

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
