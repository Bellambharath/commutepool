import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { OfferDto } from '@commutepool/shared-models';

@Injectable({ providedIn: 'root' })
export class OffersApiService {
  constructor(private http: HttpClient) {}
  getMine(page = 1, pageSize = 20) {
    return this.http.get<OfferDto[]>('/api/offers/mine', { params: new HttpParams().set('page', page).set('pageSize', pageSize) });
  }
  getAvailable(corridorId: string, date: string) {
    return this.http.get<OfferDto[]>('/api/offers/available', { params: { corridorId, date } });
  }
  getDetail(offerId: string) { return this.http.get<OfferDto>(`/api/offers/${offerId}`); }
  create(body: Partial<OfferDto>) { return this.http.post<{ offerId: string }>('/api/offers', body); }
  cancel(offerId: string, reason: string) { return this.http.post(`/api/offers/${offerId}/cancel`, { reason }); }
}
