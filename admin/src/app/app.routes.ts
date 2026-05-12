import { Routes } from '@angular/router';
import { adminAuthGuard } from '../../libs/auth/src/lib/admin-auth.guard';

export const APP_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./features/auth/admin-login.component').then(m => m.AdminLoginComponent) },
  {
    path: '',
    canActivate: [adminAuthGuard],
    loadComponent: () => import('./shell/admin-shell.component').then(m => m.AdminShellComponent),
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'users', loadComponent: () => import('./features/users/user-list.component').then(m => m.UserListComponent) },
      { path: 'users/:id', loadComponent: () => import('./features/users/user-detail.component').then(m => m.UserDetailComponent) },
      { path: 'offers', loadComponent: () => import('./features/offers/admin-offer-list.component').then(m => m.AdminOfferListComponent) },
      { path: 'trips', loadComponent: () => import('./features/trips/admin-trip-list.component').then(m => m.AdminTripListComponent) },
      { path: 'support', loadComponent: () => import('./features/support/admin-support-queue.component').then(m => m.AdminSupportQueueComponent) },
      { path: 'support/:id', loadComponent: () => import('./features/support/admin-ticket-detail.component').then(m => m.AdminTicketDetailComponent) },
      { path: 'safety', loadComponent: () => import('./features/safety/admin-safety.component').then(m => m.AdminSafetyComponent) },
      { path: 'audit', loadComponent: () => import('./features/audit/admin-audit.component').then(m => m.AdminAuditComponent) },
      { path: 'analytics', loadComponent: () => import('./features/analytics/admin-analytics.component').then(m => m.AdminAnalyticsComponent) },
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
