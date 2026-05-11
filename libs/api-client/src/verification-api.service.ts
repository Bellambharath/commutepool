import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { VerificationStatusDto } from '@commutepool/shared-models';

@Injectable({ providedIn: 'root' })
export class VerificationApiService {
  constructor(private http: HttpClient) {}
  getStatus() { return this.http.get<VerificationStatusDto>('/api/verification/status'); }
  submit(documentType: string, artifactUrl: string) {
    return this.http.post<{ caseId: string }>('/api/verification/submit', { documentType, artifactUrl });
  }
}
