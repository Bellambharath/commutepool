import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RideRequestDto } from '@commutepool/shared-models';

@Injectable({ providedIn: 'root' })
export class RequestsApiService {
  constructor(private http: HttpClient) {}
  getMine(page = 1, pageSize = 20) { return this.http.get<RideRequestDto[]>('/api/requests/mine', { params: { page, pageSize } }); }
  getForOffer(offerId: string) { return this.http.get<RideRequestDto[]>(`/api/requests/for-offer/${offerId}`); }
  send(offerId: string, note?: string) { return this.http.post<{ requestId: string }>('/api/requests', { offerId, note }); }
  withdraw(requestId: string) { return this.http.post(`/api/requests/${requestId}/withdraw`, {}); }
  accept(requestId: string) { return this.http.post(`/api/requests/${requestId}/accept`, {}); }
  decline(requestId: string, reason: string) { return this.http.post(`/api/requests/${requestId}/decline`, { reason }); }
}
