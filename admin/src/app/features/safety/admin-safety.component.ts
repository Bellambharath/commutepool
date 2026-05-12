import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../../../../libs/api-client/src/lib/admin-api.service';

@Component({
  selector: 'app-admin-safety',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-page">
      <div class="page-toolbar">
        <h2 class="page-title">Safety</h2>
        <div class="tab-group">
          <button class="tab" [class.active]="tab() === 'sos'" (click)="tab.set('sos'); load()">🚨 SOS</button>
          <button class="tab" [class.active]="tab() === 'incidents'" (click)="tab.set('incidents'); load()">📋 Incidents</button>
        </div>
      </div>

      <div *ngIf="loading()" class="center"><div class="spinner"></div></div>

      <!-- SOS Table -->
      <table class="data-table" *ngIf="!loading() && tab() === 'sos'">
        <thead><tr><th>Reporter</th><th>Trip</th><th>Location</th><th>Note</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
        <tbody>
          <tr *ngFor="let s of items()">
            <td>{{ s.reporterName }}</td>
            <td>{{ s.tripId || '—' }}</td>
            <td>{{ s.lat | number:'1.4-4' }}, {{ s.lng | number:'1.4-4' }}</td>
            <td>{{ s.note || '—' }}</td>
            <td><span class="badge {{ s.status | lowercase }}">{{ s.status }}</span></td>
            <td>{{ s.createdAt | date:'short' }}</td>
            <td>
              <button class="btn-sm success" *ngIf="s.status === 'Open'" (click)="resolveItem(s.id)">Resolve</button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Incidents Table -->
      <table class="data-table" *ngIf="!loading() && tab() === 'incidents'">
        <thead><tr><th>Reporter</th><th>Type</th><th>Trip</th><th>Description</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
        <tbody>
          <tr *ngFor="let i of items()">
            <td>{{ i.reporterName }}</td>
            <td>{{ i.incidentType }}</td>
            <td>{{ i.tripId || '—' }}</td>
            <td class="desc-cell">{{ i.description }}</td>
            <td><span class="badge {{ i.status | lowercase }}">{{ i.status }}</span></td>
            <td>{{ i.createdAt | date:'short' }}</td>
            <td>
              <button class="btn-sm success" *ngIf="i.status === 'Open'" (click)="resolveItem(i.id)">Resolve</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`.desc-cell { max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }`],
  styleUrls: ['../../shared/admin.styles.css']
})
export class AdminSafetyComponent implements OnInit {
  private api = inject(AdminApiService);
  tab = signal<'sos' | 'incidents'>('sos');
  items = signal<any[]>([]);
  loading = signal(true);

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    const obs = this.tab() === 'sos' ? this.api.listSos() : this.api.listIncidents();
    obs.subscribe({ next: d => { this.items.set(d); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  resolveItem(id: string) {
    const obs = this.tab() === 'sos' ? this.api.resolveSos(id) : this.api.resolveIncident(id);
    obs.subscribe(() => this.load());
  }
}
