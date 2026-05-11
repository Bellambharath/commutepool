import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupportApiService } from '../../../../../libs/api-client/src/lib/support-api.service';
import { TicketDetailDto } from '../../../../../libs/shared-models/src/lib/models';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page">
      <header class="page-header">
        <a routerLink="/support" class="back">← Back</a>
        <h2>Ticket</h2>
      </header>

      <div *ngIf="loading()" class="center"><div class="spinner"></div></div>

      <ng-container *ngIf="!loading() && ticket()">
        <div class="card">
          <p class="title">{{ ticket()!.subject }}</p>
          <p class="card-sub">{{ ticket()!.category }} · <span class="badge {{ ticket()!.status | lowercase }}">{{ ticket()!.status }}</span></p>
        </div>

        <div class="message-thread">
          <div class="message" *ngFor="let m of ticket()!.messages">
            <p class="msg-sender">{{ m.senderName }}</p>
            <p class="msg-body">{{ m.message }}</p>
            <p class="msg-time">{{ m.createdAt | date:'medium' }}</p>
          </div>
        </div>

        <div class="reply-bar" *ngIf="ticket()!.status !== 'Resolved' && ticket()!.status !== 'Closed'">
          <input [(ngModel)]="replyText" placeholder="Reply..." (keyup.enter)="sendReply()" />
          <button class="btn-primary sm" [disabled]="!replyText" (click)="sendReply()">Send</button>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .message-thread { padding: 16px; display: flex; flex-direction: column; gap: 12px; }
    .message { background: #f5f5f5; border-radius: 10px; padding: 12px; }
    .msg-sender { font-weight: 600; font-size: 12px; color: #1B8A5A; margin: 0 0 4px; }
    .msg-body { margin: 0; font-size: 14px; }
    .msg-time { margin: 6px 0 0; font-size: 11px; color: #aaa; }
    .reply-bar { display: flex; gap: 8px; padding: 12px 16px; border-top: 1px solid #eee; position: sticky; bottom: 64px; background: #fff; }
    .reply-bar input { flex: 1; border: 1px solid #ddd; border-radius: 8px; padding: 10px 12px; font-size: 14px; outline: none; }
  `],
  styleUrls: ['../../../shared/page.styles.css']
})
export class TicketDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(SupportApiService);
  ticket = signal<TicketDetailDto | null>(null);
  loading = signal(true);
  replyText = '';

  ngOnInit() { this.load(); }

  private load() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.getTicketDetail(id).subscribe({ next: d => { this.ticket.set(d); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  sendReply() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.addMessage(id, { message: this.replyText }).subscribe(() => { this.replyText = ''; this.load(); });
  }
}
