import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AdminApiService } from '../../../../../libs/api-client/src/lib/admin-api.service';
import { AuthService } from '../../../../../libs/auth/src/lib/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <h1>⚙️ CommutePool Admin</h1>
        <p>Operations Portal</p>
        <input type="email" [(ngModel)]="email" placeholder="Admin email" />
        <input type="password" [(ngModel)]="password" placeholder="Password" />
        <button class="btn" [disabled]="loading()" (click)="login()">{{ loading() ? 'Signing in...' : 'Sign In' }}</button>
        <p class="error" *ngIf="error()">{{ error() }}</p>
      </div>
    </div>
  `,
  styles: [`
    .login-page { min-height:100dvh; display:flex; align-items:center; justify-content:center; background:#1a2e25; }
    .login-card { background:#fff; border-radius:16px; padding:40px 32px; width:100%; max-width:380px; display:flex; flex-direction:column; gap:12px; }
    h1 { margin:0; font-size:20px; } p { color:#888; margin:0 0 8px; }
    input { border:1px solid #ddd; border-radius:8px; padding:12px; font-size:15px; outline:none; }
    .btn { background:#1B8A5A; color:#fff; border:none; border-radius:8px; padding:14px; font-size:15px; font-weight:600; cursor:pointer; }
    .btn:disabled { opacity:.5; }
    .error { color:#e53935; font-size:13px; margin:0; }
  `]
})
export class AdminLoginComponent {
  email = ''; password = '';
  loading = signal(false);
  error = signal<string | null>(null);
  private api = inject(AdminApiService);
  private auth = inject(AuthService);
  private router = inject(Router);

  login() {
    this.loading.set(true); this.error.set(null);
    this.api.adminLogin({ email: this.email, password: this.password }).subscribe({
      next: t => { this.auth.saveTokens(t.accessToken, t.refreshToken); this.router.navigate(['/dashboard']); },
      error: () => { this.error.set('Invalid credentials'); this.loading.set(false); }
    });
  }
}
