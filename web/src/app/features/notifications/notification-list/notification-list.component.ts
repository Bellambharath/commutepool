import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationsApiService } from '../../../../../libs/api-client/src/lib/notifications-api.service';
import { NotificationDto } from '../../../../../libs/shared-models/src/lib/models';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <header class="page-header">
        <h2>Notifications</h2>
        <button class="btn-text" (click)="markAllRead()">Mark all read</button>
      </header>
      <div *ngIf="loading()" class="center"><div class="spinner"></div></div>
      <div class="notif-list" *ngIf="!loading()">
        <div class="notif-item" *ngFor="let n of notifications()" [class.unread]="!n.read" (click)="markRead(n)">
          <div class="notif-dot" *ngIf="!n.read"></div>
          <div class="notif-body">
            <p class="notif-title">{{ n.title }}</p>
            <p class="notif-text">{{ n.body }}</p>
            <p class="notif-time">{{ n.createdAt | date:'shortTime' }}</p>
          </div>
        </div>
        <div *ngIf="notifications().length === 0" class="empty-state"><p>All caught up!</p></div>
      </div>
    </div>
  `,
  styles: [`
    .notif-list { padding: 0 16px; }
    .notif-item { display: flex; align-items: flex-start; gap: 10px; padding: 14px 0; border-bottom: 1px solid #f0f0f0; cursor: pointer; }
    .notif-item.unread { background: #f6fdf9; margin: 0 -16px; padding: 14px 16px; }
    .notif-dot { width: 8px; height: 8px; border-radius: 50%; background: #1B8A5A; margin-top: 6px; flex-shrink: 0; }
    .notif-title { font-weight: 600; margin: 0 0 2px; font-size: 14px; }
    .notif-text { margin: 0; font-size: 13px; color: #555; }
    .notif-time { margin: 4px 0 0; font-size: 11px; color: #aaa; }
  `],
  styleUrls: ['../../../shared/page.styles.css']
})
export class NotificationListComponent implements OnInit {
  private api = inject(NotificationsApiService);
  notifications = signal<NotificationDto[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.api.getNotifications().subscribe({ next: d => { this.notifications.set(d); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  markRead(n: NotificationDto) {
    if (n.read) return;
    this.api.markRead(n.id).subscribe(() =>
      this.notifications.update(list => list.map(x => x.id === n.id ? { ...x, read: true } : x))
    );
  }

  markAllRead() {
    this.api.markAllRead().subscribe(() =>
      this.notifications.update(list => list.map(x => ({ ...x, read: true })))
    );
  }
}
