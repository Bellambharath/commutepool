import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  { path: 'login', loadComponent: () => import('./login/login.component').then(m => m.LoginComponent) },
  { path: 'verify', loadComponent: () => import('./otp-verify/otp-verify.component').then(m => m.OtpVerifyComponent) },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
