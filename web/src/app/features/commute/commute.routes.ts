import { Routes } from '@angular/router';

export const COMMUTE_ROUTES: Routes = [
  { path: 'setup', loadComponent: () => import('./commute-setup/commute-setup.component').then(m => m.CommuteSetupComponent) }
];
