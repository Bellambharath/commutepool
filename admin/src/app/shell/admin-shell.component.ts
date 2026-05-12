import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../libs/auth/src/lib/auth.service';

const NAV = [
  { path: 'dashboard', label: 'Dashboard', icon: '📊' },
  { path: 'users',     label: 'Users',     icon: '👥' },
  { path: 'offers',   label: 'Offers',    icon: '🚗' },
  { path: 'trips',    label: 'Trips',     icon: '🗺️' },
  { path: 'support',  label: 'Support',   icon: '🎧' },
  { path: 'safety',   label: 'Safety',    icon: '🚨' },
  { path: 'audit',    label: 'Audit Log', icon: '📋' },
  { path: 'analytics',label: 'Analytics', icon: '📈' },
];

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="shell">
      <aside class="sidebar" [class.collapsed]="collapsed()">
        <div class="sidebar-header">
          <span class="logo" *ngIf="!collapsed()">⚙️ CP Admin</span>
          <button class="collapse-btn" (click)="collapsed.update(v => !v)">{{ collapsed() ? '»' : '«' }}</button>
        </div>
        <nav>
          <a *ngFor="let n of nav" [routerLink]="n.path" routerLinkActive="active">
            <span class="nav-icon">{{ n.icon }}</span>
            <span class="nav-label" *ngIf="!collapsed()">{{ n.label }}</span>
          </a>
        </nav>
        <button class="logout-btn" (click)="auth.logout()">
          <span>🚪</span><span *ngIf="!collapsed()"> Logout</span>
        </button>
      </aside>
      <main class="content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .shell { display:flex; height:100dvh; overflow:hidden; }
    .sidebar { width:220px; background:#1a2e25; color:#fff; display:flex; flex-direction:column; transition:width .2s; flex-shrink:0; }
    .sidebar.collapsed { width:56px; }
    .sidebar-header { display:flex; align-items:center; justify-content:space-between; padding:16px 12px; border-bottom:1px solid rgba(255,255,255,.1); }
    .logo { font-weight:700; font-size:15px; }
    .collapse-btn { background:transparent; border:none; color:#fff; cursor:pointer; font-size:18px; }
    nav { flex:1; overflow-y:auto; padding:8px 0; }
    nav a { display:flex; align-items:center; gap:12px; padding:12px 16px; color:rgba(255,255,255,.7); text-decoration:none; font-size:14px; }
    nav a:hover, nav a.active { background:rgba(255,255,255,.1); color:#fff; }
    .nav-icon { font-size:18px; flex-shrink:0; }
    .logout-btn { background:transparent; border:none; color:rgba(255,255,255,.6); padding:16px; cursor:pointer; display:flex; align-items:center; gap:10px; font-size:14px; }
    .content { flex:1; overflow-y:auto; background:#f4f6f8; }
  `]
})
export class AdminShellComponent {
  auth = inject(AuthService);
  nav = NAV;
  collapsed = signal(false);
}
