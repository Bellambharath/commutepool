'use client';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/offers',        icon: HomeIcon,        label: 'Home'    },
  { href: '/requests',      icon: SearchIcon,      label: 'Requests' },
  { href: '/trips',         icon: TripIcon,        label: 'Trips'   },
  { href: '/notifications', icon: BellIcon,        label: 'Alerts'  },
  { href: '/profile',       icon: ProfileIcon,     label: 'Profile' },
];

export default function BottomNav() {
  const path = usePathname();
  return (
    <nav style={s.nav} aria-label="Main navigation">
      {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
        const active = path === href || path.startsWith(href + '/');
        return (
          <a key={href} href={href} style={{ ...s.item, ...(active ? s.active : {}) }} aria-current={active ? 'page' : undefined}>
            <Icon active={active} />
            <span style={s.label}>{label}</span>
          </a>
        );
      })}
    </nav>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#01696f' : 'none'} stroke={active ? '#01696f' : '#999'} strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
function SearchIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#01696f' : '#999'} strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function TripIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#01696f' : '#999'} strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}
function BellIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#01696f' : '#999'} strokeWidth="2">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#01696f' : '#999'} strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

const s: Record<string, React.CSSProperties> = {
  nav:    { position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, display: 'flex', background: '#fff', borderTop: '1px solid #eee', zIndex: 50, paddingBottom: 'env(safe-area-inset-bottom)' },
  item:   { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 4px 10px', textDecoration: 'none', color: '#999', gap: 2 },
  active: { color: '#01696f' },
  label:  { fontSize: 10, fontWeight: 500 },
};
