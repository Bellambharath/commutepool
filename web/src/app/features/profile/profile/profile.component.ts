import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProfileApiService } from '../../../../../libs/api-client/src/lib/profile-api.service';
import { AuthService } from '../../../../../libs/auth/src/lib/auth.service';
import { UserProfileDto } from '../../../../../libs/shared-models/src/lib/models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page">
      <header class="page-header"><h2>Profile</h2></header>

      <div *ngIf="loading()" class="center"><div class="spinner"></div></div>

      <ng-container *ngIf="!loading() && profile()">
        <div class="card profile-card">
          <div class="avatar">{{ (profile()!.name || profile()!.phone)[0] | uppercase }}</div>
          <div>
            <p class="profile-name">{{ profile()!.name || 'No name set' }}</p>
            <p class="profile-phone">{{ profile()!.phone }}</p>
            <p class="trust-score">Trust Score: <strong>{{ profile()!.trustScore | number:'1.1-1' }}</strong></p>
          </div>
        </div>

        <div class="card">
          <h3>Edit Profile</h3>
          <label>Name</label><input [(ngModel)]="editName" />
          <label>Email</label><input [(ngModel)]="editEmail" type="email" />
          <button class="btn-primary sm" (click)="save()">Save</button>
        </div>

        <div class="card link-list">
          <a routerLink="/commute/setup">⚙️ Commute Setup</a>
          <a routerLink="/safety/sos">🚨 SOS</a>
          <a routerLink="/safety/report">📋 Report Incident</a>
          <a (click)="logout()" class="logout">🚪 Logout</a>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .profile-card { display:flex; align-items:center; gap:16px; }
    .avatar { width:56px; height:56px; border-radius:50%; background:#1B8A5A; color:#fff; display:flex; align-items:center; justify-content:center; font-size:24px; font-weight:700; flex-shrink:0; }
    .profile-name { font-size:18px; font-weight:600; margin:0; }
    .profile-phone { color:#888; margin:2px 0; font-size:14px; }
    .trust-score { font-size:13px; margin:4px 0 0; color:#555; }
    .link-list { display:flex; flex-direction:column; gap:16px; }
    .link-list a { font-size:15px; color:#333; cursor:pointer; text-decoration:none; }
    .logout { color:#e53935 !important; }
  `],
  styleUrls: ['../../../shared/page.styles.css']
})
export class ProfileComponent implements OnInit {
  private profileApi = inject(ProfileApiService);
  private auth = inject(AuthService);
  profile = signal<UserProfileDto | null>(null);
  loading = signal(true);
  editName = '';
  editEmail = '';

  ngOnInit() {
    this.profileApi.getProfile().subscribe({ next: p => { this.profile.set(p); this.editName = p.name ?? ''; this.editEmail = p.email ?? ''; this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  save() {
    this.profileApi.updateProfile({ name: this.editName, email: this.editEmail, gender: null }).subscribe(() =>
      this.profileApi.getProfile().subscribe(p => this.profile.set(p))
    );
  }

  logout() { this.auth.logout(); }
}
