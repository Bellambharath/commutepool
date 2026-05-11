import { Routes } from '@angular/router';

export const OFFERS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./offer-list/offer-list.component').then(m => m.OfferListComponent) },
  { path: 'create', loadComponent: () => import('./create-offer/create-offer.component').then(m => m.CreateOfferComponent) },
  { path: ':id', loadComponent: () => import('./offer-detail/offer-detail.component').then(m => m.OfferDetailComponent) }
];
