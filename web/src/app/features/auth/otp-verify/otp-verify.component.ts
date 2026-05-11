import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthApiService } from '../../../../../libs/api-client/src/lib/auth-api.service';
import { AuthService } from '../../../../../libs/auth/src/lib/auth.service';

@Component({
  selector: 'app-otp-verify',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <h2>Enter OTP</h2>
        <p class="sub">Sent to +91 {{ phone() }}</p>

        <div class="field">
          <input type="number" [(ngModel)]="otp" maxlength="6" placeholder="6-digit OTP"
            class="otp-input" />
        </div>

        <button class="btn-primary" (click)="verify()"
          [disabled]="otp().toString().length !== 6 || loading()">
          {{ loading() ? 'Verifying...' : 'Verify & Login' }}
        </button>

        <p class="error" *ngIf="error()">{{ error() }}</p>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { min-height: 100dvh; display: flex; align-items: center; justify-content: center; background: #f6f9f7; }
    .auth-card { background: #fff; border-radius: 16px; padding: 32px 24px; width: 100%; max-width: 400px; box-shadow: 0 2px 16px rgba(0,0,0,.08); }
    .sub { color: #888; margin-bottom: 24px; }
    .otp-input { width: 100%; padding: 14px; font-size: 24px; letter-spacing: 8px; text-align: center; border: 1px solid #ddd; border-radius: 8px; outline: none; }
    .btn-primary { width: 100%; margin-top: 16px; padding: 14px; background: #1B8A5A; color: #fff; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; }
    .btn-primary:disabled { opacity: .5; }
    .error { color: #e53935; font-size: 13px; margin-top: 8px; }
  `]
})
export class OtpVerifyComponent implements OnInit {
  phone = signal('');
  otp = signal('');
  loading = signal(false);
  error = signal<string | null>(null);

  private api = inject(AuthApiService);
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    const nav = this.router.getCurrentNavigation();
    const phone = nav?.extras?.state?.['phone'] ?? history.state?.phone ?? '';
    this.phone.set(phone);
  }

  verify() {
    this.loading.set(true); this.error.set(null);
    this.api.verifyOtp({ phone: `+91${this.phone()}`, otp: this.otp() }).subscribe({
      next: tokens => {
        this.authService.saveTokens(tokens.accessToken, tokens.refreshToken);
        this.router.navigate(['/offers']);
      },
      error: () => { this.error.set('Invalid OTP. Please try again.'); this.loading.set(false); }
    });
  }
}
