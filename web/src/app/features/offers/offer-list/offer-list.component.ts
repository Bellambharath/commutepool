import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OffersApiService } from '../../../../../libs/api-client/src/lib/offers-api.service';
import { OfferDto } from '../../../../../libs/shared-models/src/lib/models';

@Component({
  selector: 'app-offer-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <header class="page-header">
        <h2>My Offers</h2>
        <a routerLink="/offers/create" class="btn-icon">＋</a>
      </header>

      <div *ngIf="loading()" class="center"><div class="spinner"></div></div>

      <div *ngIf="!loading() && offers().length === 0" class="empty-state">
        <p>No offers yet.</p>
        <a routerLink="/offers/create" class="btn-primary">Create First Offer</a>
      </div>

      <div class="card-list" *ngIf="!loading()">
        <a class="card" *ngFor="let o of offers()" [routerLink]="['/offers', o.id]">
          <div class="card-row">
            <span class="title">{{ o.direction }}</span>
            <span class="badge" [class]="o.status | lowercase">{{ o.status }}</span>
          </div>
          <div class="card-sub">{{ o.offerDate }} · {{ o.departureTime }}</div>
          <div class="card-sub">{{ o.acceptedSeats }}/{{ o.availableSeats }} seats filled</div>
        </a>
      </div>
    </div>
  `,
  styleUrls: ['../../../shared/page.styles.css']
})
export class OfferListComponent implements OnInit {
  private api = inject(OffersApiService);
  offers = signal<OfferDto[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.api.getMyOffers().subscribe({ next: d => { this.offers.set(d); this.loading.set(false); }, error: () => this.loading.set(false) });
  }
}
