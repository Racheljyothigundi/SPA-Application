import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { RecordService } from '../../core/services/record.service';
import { BusinessRecord, User } from '../../core/models/user.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  records: BusinessRecord[] = [];
  filteredRecords: BusinessRecord[] = [];
  loading = true;
  errorMessage = '';
  selectedDelay = 0;
  searchTerm = '';

  constructor(
    public authService: AuthService,
    private recordService: RecordService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.selectedDelay = this.authService.selectedDelay;
    this.loadDashboardData();
  }

  get approvedCount(): number {
    return this.records.filter(r => r.status === 'Completed' || r.status === 'Approved').length;
  }

  get inProgressCount(): number {
    return this.records.filter(r => r.status === 'In Progress').length;
  }

  get pendingCount(): number {
    return this.records.filter(r => r.status === 'Pending' || r.status === 'Cancelled').length;
  }

  get productivityRate(): string {
    if (!this.records.length) return '0%';
    const rate = (this.approvedCount / this.records.length) * 100;
    return `${rate.toFixed(1)}%`;
  }

  onSearchChange(): void {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.filteredRecords = [...this.records];
      return;
    }
    this.filteredRecords = this.records.filter(r => 
      r.title.toLowerCase().includes(term) ||
      r.id.toLowerCase().includes(term) ||
      r.category.toLowerCase().includes(term) ||
      r.status.toLowerCase().includes(term)
    );
  }

  onDelayChange(event: any): void {
    this.authService.selectedDelay = parseInt(event.target.value, 10);
    this.selectedDelay = this.authService.selectedDelay;
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      profile: this.recordService.getUserProfile(),
      records: this.recordService.getRecords()
    }).subscribe({
      next: (res) => {
        this.records = res.records.records || [];
        this.filteredRecords = [...this.records];
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load dashboard records from server.';
        this.loading = false;
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}