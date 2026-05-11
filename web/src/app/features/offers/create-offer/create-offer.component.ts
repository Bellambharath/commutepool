import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { OffersApiService } from '../../../../../libs/api-client/src/lib/offers-api.service';

@Component({
  selector: 'app-create-offer',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  template: `
    <div class="page">
      <header class="page-header">
        <a routerLink="/offers" class="back">← Back</a>
        <h2>Create Offer</h2>
      </header>

      <div class="form">
        <label>Direction</label>
        <div class="chip-row">
          <button class="chip" [class.selected]="form.direction==='ToOffice'" (click)="form.direction='ToOffice'">To Office</button>
          <button class="chip" [class.selected]="form.direction==='ToHome'" (click)="form.direction='ToHome'">To Home</button>
        </div>

        <label>Offer Date</label>
        <input type="date" [(ngModel)]="form.offerDate" />

        <label>Departure Time</label>
        <input type="time" [(ngModel)]="form.departureTime" />

        <label>Available Seats</label>
        <input type="number" [(ngModel)]="form.availableSeats" min="1" max="4" />

        <button class="btn-primary" [disabled]="loading()" (click)="submit()">
          {{ loading() ? 'Posting...' : 'Post Offer' }}
        </button>

        <p class="error" *ngIf="error()">{{ error() }}</p>
      </div>
    </div>
  `,
  styleUrls: ['../../../shared/page.styles.css']
})
export class CreateOfferComponent {
  private api = inject(OffersApiService);
  private router = inject(Router);

  form = { direction: 'ToOffice', offerDate: '', departureTime: '', availableSeats: 1 };
  loading = signal(false);
  error = signal<string | null>(null);

  submit() {
    this.loading.set(true);
    this.api.createOffer({
      vehicleId: '', // TODO: pick from vehicle list
      direction: this.form.direction,
      offerDate: this.form.offerDate,
      departureTime: this.form.departureTime,
      availableSeats: this.form.availableSeats,
      startLat: 0, startLng: 0, endLat: 0, endLng: 0
    }).subscribe({
      next: () => this.router.navigate(['/offers']),
      error: e => { this.error.set(e.message); this.loading.set(false); }
    });
  }
}
