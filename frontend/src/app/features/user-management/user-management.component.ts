import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminUserService } from '../../core/services/admin-user.service';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';
  selectedDelay = 0;
  searchTerm = '';
  
  userForm: FormGroup;
  showCreateModal = false;

  constructor(
    public authService: AuthService,
    private adminUserService: AdminUserService,
    private fb: FormBuilder
  ) {
    this.userForm = this.fb.group({
      userId: ['', [Validators.required, Validators.minLength(3)]],
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['General User', Validators.required],
      password: ['User@123', Validators.required]
    });
  }

  ngOnInit(): void {
    this.selectedDelay = this.authService.selectedDelay;
    this.loadUsers();
  }

  onSearchChange(): void {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.filteredUsers = [...this.users];
      return;
    }
    this.filteredUsers = this.users.filter(u => 
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.userId.toLowerCase().includes(term) ||
      u.role.toLowerCase().includes(term) ||
      u.status.toLowerCase().includes(term)
    );
  }

  onDelayChange(event: any): void {
    this.authService.selectedDelay = parseInt(event.target.value, 10);
    this.selectedDelay = this.authService.selectedDelay;
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.errorMessage = '';
    this.adminUserService.getUsers().subscribe({
      next: (res) => {
        this.users = res.users || [];
        this.filteredUsers = [...this.users];
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to load user accounts.';
        this.loading = false;
      }
    });
  }

  openCreateModal(): void {
    this.userForm.reset({ role: 'General User', password: 'User@123' });
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  createUser(): void {
    if (this.userForm.invalid) return;
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.adminUserService.createUser(this.userForm.value).subscribe({
      next: () => {
        this.successMessage = 'User account created successfully.';
        this.closeCreateModal();
        this.loadUsers();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Failed to create user.';
      }
    });
  }

  toggleUserStatus(user: User): void {
    const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    this.adminUserService.updateUserStatus(user.userId, newStatus).subscribe({
      next: () => {
        user.status = newStatus;
        this.onSearchChange();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to update user status.';
      }
    });
  }

  deleteUser(userId: string): void {
    if (!confirm(`Are you sure you want to delete user ${userId}?`)) return;

    this.adminUserService.deleteUser(userId).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.userId !== userId);
        this.onSearchChange();
        this.successMessage = 'User deleted successfully.';
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to delete user.';
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
