import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private http = inject(HttpClient);
  private base = '/api/admin';

  // Auth
  adminLogin(body: { email: string; password: string }): Observable<{ accessToken: string; refreshToken: string }> {
    return this.http.post<any>(`${this.base}/auth/login`, body);
  }

  // Dashboard
  getDashboardStats(): Observable<any> { return this.http.get<any>(`${this.base}/dashboard/stats`); }
  getUserFunnel(): Observable<any> { return this.http.get<any>(`${this.base}/analytics/funnel`); }
  getTripMetrics(): Observable<any> { return this.http.get<any>(`${this.base}/analytics/trips`); }
  getCorridorStats(): Observable<any[]> { return this.http.get<any[]>(`${this.base}/analytics/corridors`); }

  // Users
  listUsers(params: { page?: number; search?: string }): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/users`, { params: params as any });
  }
  getUserDetail(id: string): Observable<any> { return this.http.get<any>(`${this.base}/users/${id}`); }
  suspendUser(id: string): Observable<void> { return this.http.post<void>(`${this.base}/users/${id}/suspend`, {}); }
  unsuspendUser(id: string): Observable<void> { return this.http.post<void>(`${this.base}/users/${id}/unsuspend`, {}); }
  setOwnerEligibility(id: string, eligibility: string): Observable<void> {
    return this.http.post<void>(`${this.base}/users/${id}/eligibility`, { eligibility });
  }

  // Offers
  listOffers(params: { page?: number; status?: string }): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/offers`, { params: params as any });
  }
  adminCancelOffer(id: string, body: { reason: string }): Observable<void> {
    return this.http.post<void>(`${this.base}/offers/${id}/cancel`, body);
  }

  // Trips
  listTrips(params: { page?: number; status?: string }): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/trips`, { params: params as any });
  }
  adminForceCompleteTrip(id: string): Observable<void> { return this.http.post<void>(`${this.base}/trips/${id}/complete`, {}); }
  adminForceCancelTrip(id: string, body: { reason: string }): Observable<void> {
    return this.http.post<void>(`${this.base}/trips/${id}/cancel`, body);
  }

  // Support
  listSupportTickets(params: { status?: string }): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/support/tickets`, { params: params as any });
  }
  getTicketDetail(id: string): Observable<any> { return this.http.get<any>(`${this.base}/support/tickets/${id}`); }
  adminAddTicketMessage(id: string, body: { message: string }): Observable<any> {
    return this.http.post<any>(`${this.base}/support/tickets/${id}/messages`, body);
  }
  resolveTicket(id: string, body: { resolution: string }): Observable<void> {
    return this.http.post<void>(`${this.base}/support/tickets/${id}/resolve`, body);
  }
  closeTicket(id: string): Observable<void> {
    return this.http.post<void>(`${this.base}/support/tickets/${id}/close`, {});
  }

  // Safety
  listSos(): Observable<any[]> { return this.http.get<any[]>(`${this.base}/safety/sos`); }
  resolveSos(id: string): Observable<void> { return this.http.post<void>(`${this.base}/safety/sos/${id}/resolve`, {}); }
  listIncidents(): Observable<any[]> { return this.http.get<any[]>(`${this.base}/safety/incidents`); }
  resolveIncident(id: string): Observable<void> { return this.http.post<void>(`${this.base}/safety/incidents/${id}/resolve`, {}); }

  // Audit
  listAuditLogs(params: { page?: number; entityType?: string; adminId?: string }): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/audit`, { params: params as any });
  }
}
