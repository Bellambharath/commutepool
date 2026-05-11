import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TripDto } from '@commutepool/shared-models';

@Injectable({ providedIn: 'root' })
export class TripsApiService {
  constructor(private http: HttpClient) {}
  getMine(page = 1, pageSize = 20) { return this.http.get<TripDto[]>('/api/trips', { params: { page, pageSize } }); }
  getDetail(tripId: string) { return this.http.get<TripDto>(`/api/trips/${tripId}`); }
  start(matchId: string) { return this.http.post<{ tripId: string }>('/api/trips/start', { matchId }); }
  complete(tripId: string) { return this.http.post(`/api/trips/${tripId}/complete`, {}); }
  cancel(tripId: string, reason: string) { return this.http.post(`/api/trips/${tripId}/cancel`, { reason }); }
  noShow(tripId: string) { return this.http.post(`/api/trips/${tripId}/no-show`, {}); }
}
