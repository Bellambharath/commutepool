import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminApiService } from '../../../../../libs/api-client/src/lib/admin-api.service';

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-page">
      <h2 class="page-title">Analytics</h2>

      <div *ngIf="loading()" class="center"><div class="spinner"></div></div>

      <ng-container *ngIf="!loading()">

        <!-- Trip Metrics -->
        <h3>Trip Metrics (Last 30 days)</h3>
        <div *ngIf="tripMetrics()" class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-value">{{ tripMetrics()!.totalTrips | number }}</div>
            <div class="kpi-label">Total Trips</div>
          </div>
          <div class="kpi-card accent">
            <div class="kpi-value">{{ tripMetrics()!.completionRate | percent:'1.1-1' }}</div>
            <div class="kpi-label">Completion Rate</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-value">{{ tripMetrics()!.completedTrips | number }}</div>
            <div class="kpi-label">Completed</div>
          </div>
          <div class="kpi-card warn">
            <div class="kpi-value">{{ tripMetrics()!.cancelledTrips | number }}</div>
            <div class="kpi-label">Cancelled</div>
          </div>
        </div>

        <!-- Corridor Stats -->
        <h3>Top Corridors</h3>
        <table class="data-table" *ngIf="corridors().length">
          <thead><tr><th>Corridor</th><th>Offers</th><th>Trips</th><th>Completion Rate</th></tr></thead>
          <tbody>
            <tr *ngFor="let c of corridors()">
              <td>{{ c.corridorName }}</td>
              <td>{{ c.offerCount | number }}</td>
              <td>{{ c.tripCount | number }}</td>
              <td>
                <div class="bar-wrap">
                  <div class="bar" [style.width.%]="c.completionRate * 100"></div>
                </div>
                {{ c.completionRate | percent:'1.0-1' }}
              </td>
            </tr>
          </tbody>
        </table>

        <!-- User Funnel -->
        <h3>User Funnel</h3>
        <div *ngIf="funnel()" class="funnel-table">
          <div class="funnel-row" *ngFor="let step of funnelSteps">
            <span class="funnel-label">{{ step.label }}</span>
            <span class="funnel-bar-wrap">
              <span class="funnel-bar" [style.width.%]="funnelPct(step.key)"></span>
            </span>
            <span class="funnel-val">{{ funnel()![step.key] | number }}</span>
            <span class="funnel-pct">{{ funnelPct(step.key) }}%</span>
          </div>
        </div>

      </ng-container>
    </div>
  `,
  styles: [`
    h3 { margin: 24px 0 12px; font-size:16px; }
    .kpi-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:12px; margin-bottom:24px; }
    .kpi-card { background:#fff; border-radius:10px; padding:16px; box-shadow:0 1px 3px rgba(0,0,0,.07); }
    .kpi-card.accent { border-left:4px solid #1B8A5A; }
    .kpi-card.warn { border-left:4px solid #f57f17; }
    .kpi-value { font-size:26px; font-weight:700; }
    .kpi-label { font-size:12px; color:#888; margin-top:4px; }
    .bar-wrap { display:inline-block; width:80px; height:8px; background:#eee; border-radius:4px; overflow:hidden; vertical-align:middle; margin-right:6px; }
    .bar { height:100%; background:#1B8A5A; border-radius:4px; }
    .funnel-table { display:flex; flex-direction:column; gap:10px; margin-bottom:32px; }
    .funnel-row { display:flex; align-items:center; gap:12px; }
    .funnel-label { width:200px; font-size:13px; color:#555; flex-shrink:0; }
    .funnel-bar-wrap { flex:1; background:#eee; border-radius:4px; height:10px; overflow:hidden; }
    .funnel-bar { display:block; height:100%; background:#1B8A5A; border-radius:4px; }
    .funnel-val { width:60px; text-align:right; font-size:13px; font-weight:600; color:#333; }
    .funnel-pct { width:48px; text-align:right; font-size:12px; color:#888; }
  `],
  styleUrls: ['../../shared/admin.styles.css']
})
export class AdminAnalyticsComponent implements OnInit {
  private api = inject(AdminApiService);
  tripMetrics = signal<any>(null);
  corridors = signal<any[]>([]);
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
    Promise.all([
      this.api.getTripMetrics().toPromise(),
      this.api.getCorridorStats().toPromise(),
      this.api.getUserFunnel().toPromise()
    ]).then(([m, c, f]) => {
      this.tripMetrics.set(m);
      this.corridors.set(c ?? []);
      this.funnel.set(f);
      this.loading.set(false);
    });
  }

  funnelPct(key: string): number {
    const f = this.funnel();
    if (!f || !f.signedUp) return 0;
    return Math.round((f[key] / f.signedUp) * 100);
  }
}
