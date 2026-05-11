import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NotificationDto } from '@commutepool/shared-models';

@Injectable({ providedIn: 'root' })
export class NotificationsApiService {
  constructor(private http: HttpClient) {}
  getMine(page = 1, pageSize = 20, unreadOnly = false) {
    return this.http.get<NotificationDto[]>('/api/notifications', { params: { page, pageSize, unreadOnly } });
  }
  getUnreadCount() { return this.http.get<{ count: number }>('/api/notifications/unread-count'); }
  markRead(notificationId: string) { return this.http.post(`/api/notifications/${notificationId}/read`, {}); }
  markAllRead() { return this.http.post('/api/notifications/read-all', {}); }
}
