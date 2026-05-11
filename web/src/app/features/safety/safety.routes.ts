import { Routes } from '@angular/router';

export const SAFETY_ROUTES: Routes = [
  { path: 'sos', loadComponent: () => import('./sos/sos.component').then(m => m.SosComponent) },
  { path: 'report', loadComponent: () => import('./report-incident/report-incident.component').then(m => m.ReportIncidentComponent) }
];
