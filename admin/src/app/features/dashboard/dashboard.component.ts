import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminApiService } from '../../../../../libs/api-client/src/lib/admin-api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-page">
      <h2 class="page-title">Dashboard</h2>

      <div *ngIf="loading()" class="center"><div class="spinner"></div></div>

      <div class="kpi-grid" *ngIf="!loading() && stats()">
        <div class="kpi-card">
          <div class="kpi-value">{{ stats()!.totalUsers | number }}</div>
          <div class="kpi-label">Total Users</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-value">{{ stats()!.activeUsers | number }}</div>
          <div class="kpi-label">Active (30d)</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-value">{{ stats()!.totalTrips | number }}</div>
          <div class="kpi-label">Total Trips</div>
        </div>
        <div class="kpi-card accent">
          <div class="kpi-value">{{ stats()!.completionRate | percent:'1.0-1' }}</div>
          <div class="kpi-label">Completion Rate</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-value">{{ stats()!.activeOffers | number }}</div>
          <div class="kpi-label">Active Offers</div>
        </div>
        <div class="kpi-card warn">
          <div class="kpi-value">{{ stats()!.openTickets | number }}</div>
          <div class="kpi-label">Open Tickets</div>
        </div>
        <div class="kpi-card danger">
          <div class="kpi-value">{{ stats()!.openSos | number }}</div>
          <div class="kpi-label">Open SOS</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-value">{{ stats()!.pendingVerifications | number }}</div>
          <div class="kpi-label">Pending Verifications</div>
        </div>
      </div>

      <div class="funnel-section" *ngIf="!loading() && funnel()">
        <h3>User Funnel</h3>
        <div class="funnel-table">
          <div class="funnel-row" *ngFor="let step of funnelSteps">
            <span class="funnel-label">{{ step.label }}</span>
            <span class="funnel-bar-wrap">
              <span class="funnel-bar" [style.width.%]="funnelPct(step.key)"></span>
            </span>
            <span class="funnel-val">{{ funnel()![step.key] | number }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .kpi-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:16px; margin-bottom:32px; }
    .kpi-card { background:#fff; border-radius:12px; padding:20px; box-shadow:0 1px 4px rgba(0,0,0,.07); }
    .kpi-card.accent { border-left:4px solid #1B8A5A; }
    .kpi-card.warn { border-left:4px solid #f57f17; }
    .kpi-card.danger { border-left:4px solid #c62828; }
    .kpi-value { font-size:28px; font-weight:700; color:#1a2e25; }
    .kpi-label { font-size:13px; color:#888; margin-top:4px; }
    .funnel-section h3 { margin:0 0 16px; }
    .funnel-table { display:flex; flex-direction:column; gap:10px; }
    .funnel-row { display:flex; align-items:center; gap:12px; }
    .funnel-label { width:180px; font-size:13px; color:#555; flex-shrink:0; }
    .funnel-bar-wrap { flex:1; background:#eee; border-radius:4px; height:10px; overflow:hidden; }
    .funnel-bar { display:block; height:100%; background:#1B8A5A; border-radius:4px; transition:width .4s; }
    .funnel-val { width:60px; text-align:right; font-size:13px; font-weight:600; color:#333; }
  `],
  styleUrls: ['../../shared/admin.styles.css']
})
export class DashboardComponent implements OnInit {
  private api = inject(AdminApiService);
  stats = signal<any>(null);
  funnel = signal<any>(null);
  loading = signal(true);

  funnelSteps = [
    { key: 'signedUp', label: 'Signed Up' },
    { key: 'phoneVerified', label: 'Phone Verified' },
    { key: 'commuteSetup', label: 'Commute Setup' },
    { key: 'offerOrRequest', label: 'Posted Offer / Request' },
    { key: 'completedTrip', label: 'Completed Trip' },
  ];

  ngOnInit() {
    this.api.getDashboardStats().subscribe(s => { this.stats.set(s); this.loading.set(false); });
    this.api.getUserFunnel().subscribe(f => this.funnel.set(f));
  }

  funnelPct(key: string): number {
    const f = this.funnel();
    if (!f || !f.signedUp) return 0;
    return Math.round((f[key] / f.signedUp) * 100);
  }
}
