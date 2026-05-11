import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SafetyApiService } from '../../../../../libs/api-client/src/lib/safety-api.service';

@Component({
  selector: 'app-sos',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="sos-page">
      <div class="sos-card">
        <div class="sos-icon">🚨</div>
        <h1>Emergency SOS</h1>
        <p>Your location will be shared with our safety team immediately.</p>

        <button class="sos-btn" [disabled]="state().loading || state().sent" (click)="send()">
          {{ state().sent ? '✓ SOS Sent' : state().loading ? 'Sending...' : 'SEND SOS' }}
        </button>

        <a routerLink="/trips" class="btn-outline mt">Cancel</a>

        <p class="error" *ngIf="state().error">{{ state().error }}</p>
      </div>
    </div>
  `,
  styles: [`
    .sos-page { min-height: 100dvh; display:flex; align-items:center; justify-content:center; background:#fff5f5; }
    .sos-card { text-align:center; padding:40px 24px; max-width:400px; }
    .sos-icon { font-size:72px; margin-bottom:16px; }
    h1 { color:#c62828; margin:0 0 8px; }
    p { color:#555; margin-bottom:32px; }
    .sos-btn { width:100%; padding:20px; background:#c62828; color:#fff; border:none; border-radius:12px; font-size:22px; font-weight:700; cursor:pointer; letter-spacing:2px; }
    .sos-btn:disabled { opacity:.6; cursor:not-allowed; }
    .mt { margin-top:16px; display:block; }
  `]
})
export class SosComponent {
  private api = inject(SafetyApiService);
  state = signal<{ loading: boolean; sent: boolean; error: string | null }>({ loading: false, sent: false, error: null });

  send() {
    this.state.set({ loading: true, sent: false, error: null });
    // TODO: get real GPS
    this.api.raiseSos({ tripId: null, lat: 17.385, lng: 78.4867, note: null }).subscribe({
      next: () => this.state.set({ loading: false, sent: true, error: null }),
      error: e => this.state.set({ loading: false, sent: false, error: e.message })
    });
  }
}
