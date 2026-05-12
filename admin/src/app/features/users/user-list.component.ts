import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../../../../libs/api-client/src/lib/admin-api.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="admin-page">
      <div class="page-toolbar">
        <h2 class="page-title">Users</h2>
        <input class="search-input" [(ngModel)]="search" (ngModelChange)="onSearch()" placeholder="Search by name / phone..." />
      </div>

      <div *ngIf="loading()" class="center"><div class="spinner"></div></div>

      <table class="data-table" *ngIf="!loading()">
        <thead>
          <tr><th>Name</th><th>Phone</th><th>Status</th><th>Trust</th><th>Owner Eligibility</th><th>Joined</th><th></th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let u of users()">
            <td>{{ u.name || '—' }}</td>
            <td>{{ u.phone }}</td>
            <td><span class="badge {{ u.suspended ? 'danger' : 'success' }}">{{ u.suspended ? 'Suspended' : 'Active' }}</span></td>
            <td>{{ u.trustScore | number:'1.1-1' }}</td>
            <td>{{ u.ownerEligibility }}</td>
            <td>{{ u.createdAt | date:'mediumDate' }}</td>
            <td><a [routerLink]="['/users', u.id]" class="link">View →</a></td>
          </tr>
        </tbody>
      </table>

      <div class="pagination">
        <button [disabled]="page() === 1" (click)="prevPage()">← Prev</button>
        <span>Page {{ page() }}</span>
        <button (click)="nextPage()">Next →</button>
      </div>
    </div>
  `,
  styleUrls: ['../../shared/admin.styles.css']
})
export class UserListComponent implements OnInit {
  private api = inject(AdminApiService);
  users = signal<any[]>([]);
  loading = signal(true);
  search = '';
  page = signal(1);

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.listUsers({ page: this.page(), search: this.search }).subscribe({
      next: d => { this.users.set(d); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  onSearch() { this.page.set(1); this.load(); }
  prevPage() { this.page.update(p => Math.max(1, p - 1)); this.load(); }
  nextPage() { this.page.update(p => p + 1); this.load(); }
}
