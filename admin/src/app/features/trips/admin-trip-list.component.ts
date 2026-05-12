import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../../../../libs/api-client/src/lib/admin-api.service';

@Component({
  selector: 'app-admin-trip-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-page">
      <div class="page-toolbar">
        <h2 class="page-title">Trips</h2>
        <select [(ngModel)]="filterStatus" (change)="load()">
          <option value="">All Statuses</option>
          <option>InProgress</option><option>Completed</option><option>Cancelled</option>
        </select>
      </div>

      <div *ngIf="loading()" class="center"><div class="spinner"></div></div>

      <table class="data-table" *ngIf="!loading()">
        <thead>
          <tr><th>Owner</th><th>Rider</th><th>Status</th><th>Started</th><th>Completed</th><th>Actions</th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let t of trips()">
            <td>{{ t.ownerName }}</td>
            <td>{{ t.riderName }}</td>
            <td><span class="badge {{ t.status | lowercase }}">{{ t.status }}</span></td>
            <td>{{ t.startedAt ? (t.startedAt | date:'shortDate') : '—' }}</td>
            <td>{{ t.completedAt ? (t.completedAt | date:'shortDate') : '—' }}</td>
            <td>
              <button class="btn-sm success" *ngIf="t.status === 'InProgress'" (click)="forceComplete(t.id)">Force Complete</button>
              <button class="btn-sm danger" *ngIf="t.status === 'InProgress'" (click)="forceCancel(t.id)">Force Cancel</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="pagination">
        <button [disabled]="page() === 1" (click)="changePage(-1)">← Prev</button>
        <span>Page {{ page() }}</span>
        <button (click)="changePage(1)">Next →</button>
      </div>
    </div>
  `,
  styleUrls: ['../../shared/admin.styles.css']
})
export class AdminTripListComponent implements OnInit {
  private api = inject(AdminApiService);
  trips = signal<any[]>([]);
  loading = signal(true);
  filterStatus = '';
  page = signal(1);

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.listTrips({ page: this.page(), status: this.filterStatus }).subscribe({
      next: d => { this.trips.set(d); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  forceComplete(id: string) { this.api.adminForceCompleteTrip(id).subscribe(() => this.load()); }
  forceCancel(id: string) { this.api.adminForceCancelTrip(id, { reason: 'Admin cancelled' }).subscribe(() => this.load()); }
  changePage(delta: number) { this.page.update(p => Math.max(1, p + delta)); this.load(); }
}
