import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, tap } from 'rxjs';
import { AuthTokenDto } from '@commutepool/shared-models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly ACCESS_KEY = 'cp_access';
  private readonly REFRESH_KEY = 'cp_refresh';

  private _accessToken = signal<string | null>(localStorage.getItem(this.ACCESS_KEY));

  constructor(private http: HttpClient) {}

  accessToken = () => this._accessToken();
  hasRefreshToken = () => !!localStorage.getItem(this.REFRESH_KEY);

  requestOtp$(phone: string) {
    return this.http.post('/api/auth/otp/request', { phone });
  }

  verifyOtp$(phone: string, otp: string) {
    return this.http.post<AuthTokenDto>('/api/auth/otp/verify', { phone, otp }).pipe(
      tap(res => this.storeTokens(res))
    );
  }

  refresh$() {
    const refreshToken = localStorage.getItem(this.REFRESH_KEY);
    return this.http.post<AuthTokenDto>('/api/auth/token/refresh', { refreshToken }).pipe(
      tap(res => this.storeTokens(res)),
      map(res => res.accessToken)
    );
  }

  logout() {
    localStorage.removeItem(this.ACCESS_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    this._accessToken.set(null);
  }

  private storeTokens(dto: AuthTokenDto) {
    localStorage.setItem(this.ACCESS_KEY, dto.accessToken);
    localStorage.setItem(this.REFRESH_KEY, dto.refreshToken);
    this._accessToken.set(dto.accessToken);
  }
}
