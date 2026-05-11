import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TripsApiService } from '../../../../../libs/api-client/src/lib/trips-api.service';
import { TripDto } from '../../../../../libs/shared-models/src/lib/models';

@Component({
  selector: 'app-trip-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <header class="page-header"><h2>My Trips</h2></header>
      <div *ngIf="loading()" class="center"><div class="spinner"></div></div>
      <div class="card-list" *ngIf="!loading()">
        <a class="card" *ngFor="let t of trips()" [routerLink]="['/trips', t.id]">
          <div class="card-row">
            <span class="title">{{ t.ownerName }} → {{ t.riderName }}</span>
            <span class="badge {{ t.status | lowercase }}">{{ t.status }}</span>
          </div>
          <div class="card-sub">{{ t.createdAt | date:'mediumDate' }}</div>
        </a>
        <div *ngIf="trips().length === 0" class="empty-state"><p>No trips yet.</p></div>
      </div>
    </div>
  `,
  styleUrls: ['../../../shared/page.styles.css']
})
export class TripListComponent implements OnInit {
  private api = inject(TripsApiService);
  trips = signal<TripDto[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.api.getMyTrips().subscribe({ next: d => { this.trips.set(d); this.loading.set(false); }, error: () => this.loading.set(false) });
  }
}
