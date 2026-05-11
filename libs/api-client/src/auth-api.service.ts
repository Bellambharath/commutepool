import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthTokenDto } from '@commutepool/shared-models';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  constructor(private http: HttpClient) {}
  requestOtp(phone: string) { return this.http.post('/api/auth/otp/request', { phone }); }
  verifyOtp(phone: string, otp: string) { return this.http.post<AuthTokenDto>('/api/auth/otp/verify', { phone, otp }); }
  refreshToken(refreshToken: string) { return this.http.post<AuthTokenDto>('/api/auth/token/refresh', { refreshToken }); }
  logout() { return this.http.post('/api/auth/logout', {}); }
}
