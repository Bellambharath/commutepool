import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TicketDto } from '@commutepool/shared-models';

@Injectable({ providedIn: 'root' })
export class SupportApiService {
  constructor(private http: HttpClient) {}
  getMyTickets(page = 1, pageSize = 20) { return this.http.get<TicketDto[]>('/api/support/tickets', { params: { page, pageSize } }); }
  getDetail(ticketId: string) { return this.http.get(`/api/support/tickets/${ticketId}`); }
  raise(body: { category: string; subject: string; body: string; tripId?: string }) {
    return this.http.post<{ ticketId: string }>('/api/support/tickets', body);
  }
  addMessage(ticketId: string, message: string) {
    return this.http.post(`/api/support/tickets/${ticketId}/messages`, { message });
  }
  close(ticketId: string) { return this.http.post(`/api/support/tickets/${ticketId}/close`, {}); }
}
