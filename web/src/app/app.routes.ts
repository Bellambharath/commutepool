import { Routes } from '@angular/router';
import { authGuard } from '../../libs/auth/src/lib/auth.guard';

export const APP_ROUTES: Routes = [
  { path: '', redirectTo: 'offers', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'commute',
    canActivate: [authGuard],
    loadChildren: () => import('./features/commute/commute.routes').then(m => m.COMMUTE_ROUTES)
  },
  {
    path: 'offers',
    canActivate: [authGuard],
    loadChildren: () => import('./features/offers/offers.routes').then(m => m.OFFERS_ROUTES)
  },
  {
    path: 'requests',
    canActivate: [authGuard],
    loadChildren: () => import('./features/requests/requests.routes').then(m => m.REQUESTS_ROUTES)
  },
  {
    path: 'trips',
    canActivate: [authGuard],
    loadChildren: () => import('./features/trips/trips.routes').then(m => m.TRIPS_ROUTES)
  },
  {
    path: 'notifications',
    canActivate: [authGuard],
    loadChildren: () => import('./features/notifications/notifications.routes').then(m => m.NOTIFICATIONS_ROUTES)
  },
  {
    path: 'support',
    canActivate: [authGuard],
    loadChildren: () => import('./features/support/support.routes').then(m => m.SUPPORT_ROUTES)
  },
  {
    path: 'safety',
    canActivate: [authGuard],
    loadChildren: () => import('./features/safety/safety.routes').then(m => m.SAFETY_ROUTES)
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadChildren: () => import('./features/profile/profile.routes').then(m => m.PROFILE_ROUTES)
  },
  { path: '**', redirectTo: 'offers' }
];
