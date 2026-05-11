import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OffersApiService } from '../../../../../libs/api-client/src/lib/offers-api.service';
import { RequestsApiService } from '../../../../../libs/api-client/src/lib/requests-api.service';
import { OfferDto, RideRequestDto } from '../../../../../libs/shared-models/src/lib/models';

@Component({
  selector: 'app-offer-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <header class="page-header">
        <a routerLink="/offers" class="back">← Back</a>
        <h2>Offer Detail</h2>
      </header>

      <div *ngIf="loading()" class="center"><div class="spinner"></div></div>

      <ng-container *ngIf="!loading() && offer()">
        <div class="card">
          <div class="card-row">
            <span class="title">{{ offer()!.direction }}</span>
            <span class="badge {{ offer()!.status | lowercase }}">{{ offer()!.status }}</span>
          </div>
          <p>Date: {{ offer()!.offerDate }} · {{ offer()!.departureTime }}</p>
          <p>Seats: {{ offer()!.acceptedSeats }}/{{ offer()!.availableSeats }}</p>
        </div>

        <h3 class="section-title">Ride Requests</h3>

        <div *ngIf="requests().length === 0" class="empty-state"><p>No requests yet.</p></div>

        <div class="card" *ngFor="let r of requests()">
          <div class="card-row">
            <span class="title">{{ r.riderName }}</span>
            <span class="badge {{ r.status | lowercase }}">{{ r.status }}</span>
          </div>
          <p *ngIf="r.note" class="note">{{ r.note }}</p>
          <div class="action-row" *ngIf="r.status === 'Pending'">
            <button class="btn-primary sm" (click)="accept(r.id)">Accept</button>
            <button class="btn-outline sm" (click)="decline(r.id)">Decline</button>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styleUrls: ['../../../shared/page.styles.css']
})
export class OfferDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private offersApi = inject(OffersApiService);
  private requestsApi = inject(RequestsApiService);

  offer = signal<OfferDto | null>(null);
  requests = signal<RideRequestDto[]>([]);
  loading = signal(true);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.offersApi.getOfferDetail(id).subscribe(o => { this.offer.set(o); this.loading.set(false); });
    this.requestsApi.getRequestsForOffer(id).subscribe(r => this.requests.set(r));
  }

  accept(id: string) {
    this.requestsApi.acceptRequest(id).subscribe(() => this.reload());
  }

  decline(id: string) {
    this.requestsApi.declineRequest(id, { reason: 'Not suitable' }).subscribe(() => this.reload());
  }

  private reload() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.requestsApi.getRequestsForOffer(id).subscribe(r => this.requests.set(r));
  }
}
