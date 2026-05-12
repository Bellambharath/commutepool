import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../../../../libs/api-client/src/lib/admin-api.service';

@Component({
  selector: 'app-admin-offer-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-page">
      <div class="page-toolbar">
        <h2 class="page-title">Offers</h2>
        <div class="filters">
          <select [(ngModel)]="filterStatus" (change)="load()">
            <option value="">All Statuses</option>
            <option>Active</option><option>Full</option><option>Cancelled</option><option>Completed</option>
          </select>
        </div>
      </div>

      <div *ngIf="loading()" class="center"><div class="spinner"></div></div>

      <table class="data-table" *ngIf="!loading()">
        <thead>
          <tr><th>Owner</th><th>Direction</th><th>Date</th><th>Seats</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let o of offers()">
            <td>{{ o.ownerName }}</td>
            <td>{{ o.direction }}</td>
            <td>{{ o.offerDate }}</td>
            <td>{{ o.acceptedSeats }}/{{ o.availableSeats }}</td>
            <td><span class="badge {{ o.status | lowercase }}">{{ o.status }}</span></td>
            <td>
              <button class="btn-sm danger" *ngIf="o.status === 'Active' || o.status === 'Full'" (click)="cancel(o.id)">Cancel</button>
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
export class AdminOfferListComponent implements OnInit {
  private api = inject(AdminApiService);
  offers = signal<any[]>([]);
  loading = signal(true);
  filterStatus = '';
  page = signal(1);

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.listOffers({ page: this.page(), status: this.filterStatus }).subscribe({
      next: d => { this.offers.set(d); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  cancel(id: string) {
    this.api.adminCancelOffer(id, { reason: 'Admin cancelled' }).subscribe(() => this.load());
  }

  changePage(delta: number) { this.page.update(p => Math.max(1, p + delta)); this.load(); }
}
