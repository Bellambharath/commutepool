import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupportApiService } from '../../../../../libs/api-client/src/lib/support-api.service';
import { TicketDto } from '../../../../../libs/shared-models/src/lib/models';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page">
      <header class="page-header">
        <h2>Support</h2>
        <button class="btn-icon" (click)="showDialog = true">＋</button>
      </header>

      <div *ngIf="loading()" class="center"><div class="spinner"></div></div>

      <div class="card-list" *ngIf="!loading()">
        <a class="card" *ngFor="let t of tickets()" [routerLink]="['/support', t.id]">
          <div class="card-row">
            <span class="title">{{ t.subject }}</span>
            <span class="badge {{ t.status | lowercase }}">{{ t.status }}</span>
          </div>
          <div class="card-sub">{{ t.category }}</div>
        </a>
        <div *ngIf="tickets().length === 0" class="empty-state"><p>No tickets raised.</p></div>
      </div>
    </div>

    <!-- Raise Ticket Dialog -->
    <div class="modal-overlay" *ngIf="showDialog" (click)="showDialog=false">
      <div class="modal" (click)="$event.stopPropagation()">
        <h3>New Support Ticket</h3>
        <input [(ngModel)]="newSubject" placeholder="Subject" />
        <textarea [(ngModel)]="newBody" placeholder="Describe your issue" rows="4"></textarea>
        <div class="modal-actions">
          <button class="btn-outline" (click)="showDialog=false">Cancel</button>
          <button class="btn-primary" [disabled]="!newSubject || !newBody" (click)="raise()">Submit</button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['../../../shared/page.styles.css']
})
export class TicketListComponent implements OnInit {
  private api = inject(SupportApiService);
  tickets = signal<TicketDto[]>([]);
  loading = signal(true);
  showDialog = false;
  newSubject = '';
  newBody = '';

  ngOnInit() {
    this.api.getMyTickets().subscribe({ next: d => { this.tickets.set(d); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  raise() {
    this.api.raiseTicket({ category: 'General', subject: this.newSubject, body: this.newBody, tripId: null }).subscribe(() => {
      this.showDialog = false; this.newSubject = ''; this.newBody = '';
      this.api.getMyTickets().subscribe(d => this.tickets.set(d));
    });
  }
}
