import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CommuteApiService } from '../../../../../libs/api-client/src/lib/commute-api.service';

@Component({
  selector: 'app-commute-setup',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  template: `
    <div class="page">
      <header class="page-header">
        <a routerLink="/profile" class="back">← Back</a>
        <h2>Commute Setup</h2>
      </header>

      <div class="form">
        <label>Home Area</label>
        <input [(ngModel)]="form.homeArea" placeholder="e.g. Gachibowli" />

        <label>Office Area</label>
        <input [(ngModel)]="form.officeArea" placeholder="e.g. HITEC City" />

        <label>Morning Departure</label>
        <input type="time" [(ngModel)]="form.morningDepartureTime" />

        <label>Evening Departure</label>
        <input type="time" [(ngModel)]="form.eveningDepartureTime" />

        <label>Active Days</label>
        <div class="chip-row">
          <button class="chip" *ngFor="let d of allDays"
            [class.selected]="form.activeDays.includes(d)"
            (click)="toggleDay(d)">{{ d }}</button>
        </div>

        <button class="btn-primary" [disabled]="loading()" (click)="save()">
          {{ loading() ? 'Saving...' : 'Save Profile' }}
        </button>
        <p class="error" *ngIf="error()">{{ error() }}</p>
      </div>
    </div>
  `,
  styleUrls: ['../../../shared/page.styles.css']
})
export class CommuteSetupComponent implements OnInit {
  private api = inject(CommuteApiService);
  private router = inject(Router);

  allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  form = { corridorId: '', homeArea: '', homeLat: 0, homeLng: 0, officeArea: '', officeLat: 0, officeLng: 0, morningDepartureTime: '08:30', eveningDepartureTime: '18:30', activeDays: ['Mon','Tue','Wed','Thu','Fri'] };
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit() {
    this.api.getCommuteProfile().subscribe({ next: p => { if (p) Object.assign(this.form, p); }, error: () => {} });
  }

  toggleDay(day: string) {
    const idx = this.form.activeDays.indexOf(day);
    if (idx >= 0) this.form.activeDays.splice(idx, 1);
    else this.form.activeDays.push(day);
  }

  save() {
    this.loading.set(true);
    this.api.upsertCommuteProfile(this.form).subscribe({
      next: () => this.router.navigate(['/profile']),
      error: e => { this.error.set(e.message); this.loading.set(false); }
    });
  }
}
