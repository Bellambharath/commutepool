import { Routes } from '@angular/router';

export const TRIPS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./trip-list/trip-list.component').then(m => m.TripListComponent) },
  { path: ':id', loadComponent: () => import('./trip-detail/trip-detail.component').then(m => m.TripDetailComponent) }
];
