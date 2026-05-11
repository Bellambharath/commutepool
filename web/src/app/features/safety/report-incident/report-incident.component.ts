import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SafetyApiService } from '../../../../../libs/api-client/src/lib/safety-api.service';

@Component({
  selector: 'app-report-incident',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  template: `
    <div class="page">
      <header class="page-header">
        <a routerLink="/trips" class="back">← Back</a>
        <h2>Report Incident</h2>
      </header>

      <div class="form">
        <label>Incident Type</label>
        <div class="chip-row">
          <button class="chip" *ngFor="let t of types"
            [class.selected]="form.incidentType === t"
            (click)="form.incidentType = t">{{ t }}</button>
        </div>

        <label>Description</label>
        <textarea [(ngModel)]="form.description" rows="5" placeholder="Describe what happened"></textarea>

        <button class="btn-primary" [disabled]="!form.incidentType || !form.description || loading()" (click)="submit()">
          {{ loading() ? 'Submitting...' : 'Submit Report' }}
        </button>

        <p class="error" *ngIf="error()">{{ error() }}</p>
      </div>
    </div>
  `,
  styleUrls: ['../../../shared/page.styles.css']
})
export class ReportIncidentComponent {
  private api = inject(SafetyApiService);
  private router = inject(Router);

  types = ['Harassment', 'Accident', 'RecklessDriving', 'VehicleMismatch', 'Other'];
  form = { incidentType: '', description: '' };
  loading = signal(false);
  error = signal<string | null>(null);

  submit() {
    this.loading.set(true);
    this.api.reportIncident({ tripId: null, incidentType: this.form.incidentType, description: this.form.description }).subscribe({
      next: () => this.router.navigate(['/trips']),
      error: e => { this.error.set(e.message); this.loading.set(false); }
    });
  }
}
