import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommuteProfileDto } from '@commutepool/shared-models';

@Injectable({ providedIn: 'root' })
export class CommuteApiService {
  constructor(private http: HttpClient) {}
  getProfile() { return this.http.get<CommuteProfileDto | null>('/api/commute/profile'); }
  upsertProfile(body: Partial<CommuteProfileDto>) { return this.http.put<{ profileId: string }>('/api/commute/profile', body); }
  pause() { return this.http.post('/api/commute/profile/pause', {}); }
  resume() { return this.http.post('/api/commute/profile/resume', {}); }
}
