import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TripsApiService } from '../../../../../libs/api-client/src/lib/trips-api.service';
import { TripDto } from '../../../../../libs/shared-models/src/lib/models';

@Component({
  selector: 'app-trip-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <header class="page-header">
        <a routerLink="/trips" class="back">← Back</a>
        <h2>Trip Detail</h2>
      </header>

      <div *ngIf="loading()" class="center"><div class="spinner"></div></div>

      <ng-container *ngIf="!loading() && trip()">
        <div class="card">
          <p><strong>Owner:</strong> {{ trip()!.ownerName }}</p>
          <p><strong>Rider:</strong> {{ trip()!.riderName }}</p>
          <p><strong>Status:</strong>
            <span class="badge {{ trip()!.status | lowercase }}">{{ trip()!.status }}</span>
          </p>
          <p *ngIf="trip()!.startedAt"><strong>Started:</strong> {{ trip()!.startedAt | date:'medium' }}</p>
          <p *ngIf="trip()!.completedAt"><strong>Completed:</strong> {{ trip()!.completedAt | date:'medium' }}</p>
          <p *ngIf="trip()!.cancelledAt" class="warn"><strong>Cancelled:</strong> {{ trip()!.cancelReason }}</p>
        </div>

        <div class="action-row" *ngIf="trip()!.status === 'InProgress'">
          <button class="btn-primary" (click)="complete()">Complete Trip</button>
          <button class="btn-outline" (click)="cancel()">Cancel</button>
        </div>

        <div class="safety-links">
          <a routerLink="/safety/sos" class="btn-danger">🚨 SOS</a>
          <a routerLink="/safety/report" class="btn-outline">Report Incident</a>
        </div>

        <p class="error" *ngIf="actionError()">{{ actionError() }}</p>
      </ng-container>
    </div>
  `,
  styleUrls: ['../../../shared/page.styles.css']
})
export class TripDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(TripsApiService);

  trip = signal<TripDto | null>(null);
  loading = signal(true);
  actionError = signal<string | null>(null);

  ngOnInit() { this.load(); }

  private load() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.getTripDetail(id).subscribe({ next: t => { this.trip.set(t); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  complete() {
    this.api.completeTrip(this.trip()!.id).subscribe({ next: () => this.load(), error: e => this.actionError.set(e.message) });
  }

  cancel() {
    this.api.cancelTrip(this.trip()!.id, { reason: 'Cancelled by user' }).subscribe({ next: () => this.load(), error: e => this.actionError.set(e.message) });
  }
}
