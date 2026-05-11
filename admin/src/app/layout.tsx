import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CommutePool Admin',
  description: 'CommutePool operations and compliance portal',
  robots: 'noindex,nofollow',
};

export default function AdminRootLayout({
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
