import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RequestsApiService } from '../../../../../libs/api-client/src/lib/requests-api.service';
import { RideRequestDto } from '../../../../../libs/shared-models/src/lib/models';

@Component({
  selector: 'app-request-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <header class="page-header"><h2>My Requests</h2></header>
      <div *ngIf="loading()" class="center"><div class="spinner"></div></div>
      <div class="card-list" *ngIf="!loading()">
        <div class="card" *ngFor="let r of requests()">
          <div class="card-row">
            <span class="title">{{ r.riderName }}</span>
            <span class="badge {{ r.status | lowercase }}">{{ r.status }}</span>
          </div>
          <p *ngIf="r.note" class="note">{{ r.note }}</p>
          <button *ngIf="r.status === 'Pending'" class="btn-outline sm" (click)="withdraw(r.id)">Withdraw</button>
        </div>
        <div *ngIf="requests().length === 0" class="empty-state"><p>No requests sent.</p></div>
      </div>
    </div>
  `,
  styleUrls: ['../../../shared/page.styles.css']
})
export class RequestListComponent implements OnInit {
  private api = inject(RequestsApiService);
  requests = signal<RideRequestDto[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.api.getMyRequests().subscribe({ next: d => { this.requests.set(d); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  withdraw(id: string) {
    this.api.withdrawRequest(id).subscribe(() =>
      this.requests.update(list => list.map(r => r.id === id ? { ...r, status: 'Withdrawn' } : r))
    );
  }
}
