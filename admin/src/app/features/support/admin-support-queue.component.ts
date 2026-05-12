import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../../../../libs/api-client/src/lib/admin-api.service';

@Component({
  selector: 'app-admin-support-queue',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="admin-page">
      <div class="page-toolbar">
        <h2 class="page-title">Support Queue</h2>
        <select [(ngModel)]="filterStatus" (change)="load()">
          <option value="">All</option>
          <option>Open</option><option>InProgress</option><option>Resolved</option><option>Closed</option>
        </select>
      </div>

      <div *ngIf="loading()" class="center"><div class="spinner"></div></div>

      <table class="data-table" *ngIf="!loading()">
        <thead>
          <tr><th>Subject</th><th>Category</th><th>User</th><th>Status</th><th>Created</th><th></th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let t of tickets()">
            <td>{{ t.subject }}</td>
            <td>{{ t.category }}</td>
            <td>{{ t.userName }}</td>
            <td><span class="badge {{ t.status | lowercase }}">{{ t.status }}</span></td>
            <td>{{ t.createdAt | date:'shortDate' }}</td>
            <td><a [routerLink]="['/support', t.id]" class="link">Handle →</a></td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styleUrls: ['../../shared/admin.styles.css']
})
export class AdminSupportQueueComponent implements OnInit {
  private api = inject(AdminApiService);
  tickets = signal<any[]>([]);
  loading = signal(true);
  filterStatus = 'Open';

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.listSupportTickets({ status: this.filterStatus }).subscribe({
      next: d => { this.tickets.set(d); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
