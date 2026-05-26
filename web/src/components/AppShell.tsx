'use client';
import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken } from '@/lib/auth';
import BottomNav from './BottomNav';

interface Props {
  title?: string;
  rightAction?: ReactNode;
  children: ReactNode;
}

export default function AppShell({ title, rightAction, children }: Props) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace('/auth/login');
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
        <div style={{ width: 36, height: 36, border: '3px solid #e0e0e0', borderTopColor: '#01696f', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: '#f7f6f2', fontFamily: 'system-ui,sans-serif', maxWidth: 480, margin: '0 auto' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: '#fff', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="28" height="28" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <circle cx="20" cy="20" r="20" fill="#01696f" />
            <circle cx="13" cy="22" r="4" fill="white" />
            <circle cx="27" cy="22" r="4" fill="white" />
            <path d="M11 19 Q20 12 29 19" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
          </svg>
          <span style={{ fontWeight: 700, fontSize: 17, color: '#01696f' }}>{title || 'CommutePool'}</span>
        </div>
        {rightAction}
      </header>
      <main style={{ flex: 1, padding: '20px 16px 96px', overflowY: 'auto' }}>
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
