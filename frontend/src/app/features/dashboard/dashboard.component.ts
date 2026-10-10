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
  loading = true;
  errorMessage = '';
  selectedDelay = 0;

  constructor(
    public authService: AuthService,
    private recordService: RecordService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.selectedDelay = this.authService.selectedDelay;
    this.loadDashboardData();
  }

  get completedCount(): number {
    return this.records.filter(r => r.status === 'Completed').length;
  }

  get inProgressCount(): number {
    return this.records.filter(r => r.status === 'In Progress').length;
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
        this.records = res.records.records;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load dashboard records.';
        this.loading = false;
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}