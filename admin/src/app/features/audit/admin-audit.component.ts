import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../../../../libs/api-client/src/lib/admin-api.service';

@Component({
  selector: 'app-admin-audit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-page">
      <div class="page-toolbar">
        <h2 class="page-title">Audit Log</h2>
        <div class="filters">
          <input [(ngModel)]="filterEntity" (ngModelChange)="load()" placeholder="Entity type..." class="search-input small" />
          <input [(ngModel)]="filterActor" (ngModelChange)="load()" placeholder="Admin ID..." class="search-input small" />
        </div>
      </div>

      <div *ngIf="loading()" class="center"><div class="spinner"></div></div>

      <table class="data-table" *ngIf="!loading()">
        <thead>
          <tr><th>Action</th><th>Entity Type</th><th>Entity ID</th><th>Admin</th><th>Changes</th><th>Time</th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let log of logs()">
            <td><span class="badge info">{{ log.action }}</span></td>
            <td>{{ log.entityType }}</td>
            <td class="mono">{{ log.entityId | slice:0:8 }}…</td>
            <td>{{ log.adminName || log.adminId }}</td>
            <td class="changes-cell">{{ log.changes | json }}</td>
            <td>{{ log.createdAt | date:'short' }}</td>
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
  styles: [`.mono { font-family:monospace; font-size:12px; } .changes-cell { max-width:200px; font-size:11px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }`],
  styleUrls: ['../../shared/admin.styles.css']
})
export class AdminAuditComponent implements OnInit {
  private api = inject(AdminApiService);
  logs = signal<any[]>([]);
  loading = signal(true);
  filterEntity = '';
  filterActor = '';
  page = signal(1);

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.listAuditLogs({ page: this.page(), entityType: this.filterEntity, adminId: this.filterActor }).subscribe({
      next: d => { this.logs.set(d); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  changePage(delta: number) { this.page.update(p => Math.max(1, p + delta)); this.load(); }
}
