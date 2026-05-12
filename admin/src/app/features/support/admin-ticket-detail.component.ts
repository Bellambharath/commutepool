import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../../../../libs/api-client/src/lib/admin-api.service';

@Component({
  selector: 'app-admin-ticket-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="admin-page">
      <div class="page-toolbar">
        <a routerLink="/support" class="back">← Support Queue</a>
        <h2 class="page-title">Ticket Detail</h2>
      </div>

      <div *ngIf="loading()" class="center"><div class="spinner"></div></div>

      <ng-container *ngIf="!loading() && ticket()">
        <div class="detail-card">
          <div class="detail-row"><span>Subject</span><strong>{{ ticket()!.subject }}</strong></div>
          <div class="detail-row"><span>Category</span><strong>{{ ticket()!.category }}</strong></div>
          <div class="detail-row"><span>Status</span>
            <span class="badge {{ ticket()!.status | lowercase }}">{{ ticket()!.status }}</span>
          </div>
          <div class="detail-row" *ngIf="ticket()!.resolution"><span>Resolution</span><strong>{{ ticket()!.resolution }}</strong></div>
        </div>

        <div class="message-thread">
          <div class="message" *ngFor="let m of ticket()!.messages">
            <p class="msg-sender">{{ m.senderName }}</p>
            <p class="msg-body">{{ m.message }}</p>
            <p class="msg-time">{{ m.createdAt | date:'medium' }}</p>
          </div>
        </div>

        <div class="reply-form" *ngIf="ticket()!.status !== 'Closed'">
          <textarea [(ngModel)]="reply" rows="3" placeholder="Admin reply..."></textarea>
          <div class="action-bar">
            <button class="btn-primary" [disabled]="!reply" (click)="sendReply()">Send Reply</button>
            <button class="btn-outline" (click)="resolve()">Mark Resolved</button>
            <button class="btn-danger" (click)="close()">Close Ticket</button>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .message-thread { padding:16px; display:flex; flex-direction:column; gap:12px; max-height:360px; overflow-y:auto; }
    .message { background:#f5f5f5; border-radius:10px; padding:12px; }
    .msg-sender { font-weight:600; font-size:12px; color:#1B8A5A; margin:0 0 4px; }
    .msg-body { margin:0; font-size:14px; }
    .msg-time { margin:4px 0 0; font-size:11px; color:#aaa; }
    .reply-form { padding:16px; display:flex; flex-direction:column; gap:10px; }
    .reply-form textarea { border:1px solid #ddd; border-radius:8px; padding:12px; font-size:14px; outline:none; resize:vertical; }
  `],
  styleUrls: ['../../shared/admin.styles.css']
})
export class AdminTicketDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(AdminApiService);
  ticket = signal<any>(null);
  loading = signal(true);
  reply = '';

  ngOnInit() { this.load(); }

  private load() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.getTicketDetail(id).subscribe({ next: t => { this.ticket.set(t); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  sendReply() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.adminAddTicketMessage(id, { message: this.reply }).subscribe(() => { this.reply = ''; this.load(); });
  }

  resolve() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.resolveTicket(id, { resolution: 'Resolved by admin' }).subscribe(() => this.load());
  }

  close() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.closeTicket(id).subscribe(() => this.load());
  }
}
