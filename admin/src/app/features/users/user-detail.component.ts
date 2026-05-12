import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminApiService } from '../../../../../libs/api-client/src/lib/admin-api.service';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="admin-page">
      <div class="page-toolbar">
        <a routerLink="/users" class="back">← Users</a>
        <h2 class="page-title">User Detail</h2>
      </div>

      <div *ngIf="loading()" class="center"><div class="spinner"></div></div>

      <ng-container *ngIf="!loading() && user()">
        <div class="detail-card">
          <div class="detail-row"><span>Name</span><strong>{{ user()!.name || '—' }}</strong></div>
          <div class="detail-row"><span>Phone</span><strong>{{ user()!.phone }}</strong></div>
          <div class="detail-row"><span>Email</span><strong>{{ user()!.email || '—' }}</strong></div>
          <div class="detail-row"><span>Gender</span><strong>{{ user()!.gender || '—' }}</strong></div>
          <div class="detail-row"><span>Trust Score</span><strong>{{ user()!.trustScore | number:'1.1-1' }}</strong></div>
          <div class="detail-row"><span>Owner Eligibility</span><strong>{{ user()!.ownerEligibility }}</strong></div>
          <div class="detail-row"><span>Status</span>
            <span class="badge {{ user()!.suspended ? 'danger' : 'success' }}">
              {{ user()!.suspended ? 'Suspended' : 'Active' }}
            </span>
          </div>
          <div class="detail-row"><span>Joined</span><strong>{{ user()!.createdAt | date:'medium' }}</strong></div>
        </div>

        <div class="action-bar">
          <button class="btn-primary" (click)="verify()" *ngIf="user()!.ownerEligibility !== 'Eligible'">Mark Eligible</button>
          <button class="btn-danger" (click)="suspend()" *ngIf="!user()!.suspended">Suspend User</button>
          <button class="btn-outline" (click)="unsuspend()" *ngIf="user()!.suspended">Unsuspend</button>
        </div>

        <p class="action-msg" *ngIf="msg()">{{ msg() }}</p>
      </ng-container>
    </div>
  `,
  styleUrls: ['../../shared/admin.styles.css']
})
export class UserDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(AdminApiService);
  user = signal<any>(null);
  loading = signal(true);
  msg = signal<string | null>(null);

  ngOnInit() { this.load(); }

  private load() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.getUserDetail(id).subscribe({ next: u => { this.user.set(u); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  verify() { this.api.setOwnerEligibility(this.user()!.id, 'Eligible').subscribe(() => { this.msg.set('Eligibility updated'); this.load(); }); }
  suspend() { this.api.suspendUser(this.user()!.id).subscribe(() => { this.msg.set('User suspended'); this.load(); }); }
  unsuspend() { this.api.unsuspendUser(this.user()!.id).subscribe(() => { this.msg.set('User unsuspended'); this.load(); }); }
}
