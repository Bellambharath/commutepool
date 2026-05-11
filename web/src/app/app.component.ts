import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../libs/auth/src/lib/auth.service';
import { NotificationsApiService } from '../../libs/api-client/src/lib/notifications-api.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="app-shell">
      <nav class="bottom-nav" *ngIf="auth.isLoggedIn()">
        <a routerLink="/offers" routerLinkActive="active">
          <span class="icon">🚗</span><span class="label">Offers</span>
        </a>
        <a routerLink="/trips" routerLinkActive="active">
          <span class="icon">🗺️</span><span class="label">Trips</span>
        </a>
        <a routerLink="/notifications" routerLinkActive="active">
          <span class="icon">🔔</span>
          <span class="badge" *ngIf="unreadCount() > 0">{{ unreadCount() }}</span>
          <span class="label">Alerts</span>
        </a>
        <a routerLink="/support" routerLinkActive="active">
          <span class="icon">🎧</span><span class="label">Support</span>
        </a>
        <a routerLink="/profile" routerLinkActive="active">
          <span class="icon">👤</span><span class="label">Profile</span>
        </a>
      </nav>
      <main class="page-content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .app-shell { display: flex; flex-direction: column; height: 100dvh; }
    .page-content { flex: 1; overflow-y: auto; padding-bottom: 64px; }
    .bottom-nav {
      position: fixed; bottom: 0; left: 0; right: 0; height: 64px;
      display: flex; background: #fff; border-top: 1px solid #e0e0e0;
      z-index: 100;
    }
    .bottom-nav a {
      flex: 1; display: flex; flex-direction: column; align-items: center;
      justify-content: center; text-decoration: none; color: #666; font-size: 11px;
      position: relative;
    }
    .bottom-nav a.active { color: #1B8A5A; }
    .bottom-nav .icon { font-size: 22px; }
    .badge {
      position: absolute; top: 6px; right: 18px;
      background: #F76C1B; color: #fff; border-radius: 10px;
      font-size: 10px; padding: 1px 5px; min-width: 16px; text-align: center;
    }
  `]
})
export class AppComponent implements OnInit {
  auth = inject(AuthService);
  private notifApi = inject(NotificationsApiService);
  unreadCount = signal(0);

  ngOnInit() {
    if (this.auth.isLoggedIn()) this.loadUnread();
  }

  private loadUnread() {
    this.notifApi.getUnreadCount().subscribe(r => this.unreadCount.set(r.count));
  }
}
