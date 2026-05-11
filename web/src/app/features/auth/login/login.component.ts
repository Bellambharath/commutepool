import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthApiService } from '../../../../../libs/api-client/src/lib/auth-api.service';
import { AuthService } from '../../../../../libs/auth/src/lib/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <h1>CommutePool</h1>
        <p class="tagline">Ride safe. Ride smart.</p>

        <div class="field">
          <label>Mobile Number</label>
          <div class="phone-input">
            <span class="prefix">+91</span>
            <input type="tel" [(ngModel)]="phone" maxlength="10" placeholder="10-digit number" />
          </div>
        </div>

        <button class="btn-primary" (click)="requestOtp()"
          [disabled]="phone().length !== 10 || loading()">
          {{ loading() ? 'Sending...' : 'Get OTP' }}
        </button>

        <p class="error" *ngIf="error()">{{ error() }}</p>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { min-height: 100dvh; display: flex; align-items: center; justify-content: center; background: #f6f9f7; }
    .auth-card { background: #fff; border-radius: 16px; padding: 32px 24px; width: 100%; max-width: 400px; box-shadow: 0 2px 16px rgba(0,0,0,.08); }
    h1 { color: #1B8A5A; margin: 0 0 4px; }
    .tagline { color: #888; margin: 0 0 32px; }
    .field label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; }
    .phone-input { display: flex; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
    .prefix { padding: 12px; background: #f5f5f5; color: #555; border-right: 1px solid #ddd; }
    .phone-input input { flex: 1; border: none; outline: none; padding: 12px; font-size: 16px; }
    .btn-primary { width: 100%; margin-top: 16px; padding: 14px; background: #1B8A5A; color: #fff; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; }
    .btn-primary:disabled { opacity: .5; cursor: not-allowed; }
    .error { color: #e53935; font-size: 13px; margin-top: 8px; }
  `]
})
export class LoginComponent {
  phone = signal('');
  loading = signal(false);
  error = signal<string | null>(null);

  private api = inject(AuthApiService);
  private authService = inject(AuthService);
  private router = inject(Router);

  requestOtp() {
    this.loading.set(true); this.error.set(null);
    this.api.requestOtp({ phone: `+91${this.phone()}` }).subscribe({
      next: () => this.router.navigate(['/auth/verify'], { state: { phone: this.phone() } }),
      error: e => { this.error.set(e.message || 'Failed to send OTP'); this.loading.set(false); }
    });
  }
}
