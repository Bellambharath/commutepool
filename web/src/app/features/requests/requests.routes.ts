import { Routes } from '@angular/router';

export const REQUESTS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./request-list/request-list.component').then(m => m.RequestListComponent) }
];
