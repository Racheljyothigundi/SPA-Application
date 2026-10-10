import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  showPassword = false;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      userId: ['admin01', Validators.required],
      password: ['Admin@123', Validators.required],
      role: ['Admin', Validators.required]
    });
  }

  selectRole(role: string): void {
    this.loginForm.patchValue({ role });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  quickLogin(roleType: 'Admin' | 'General User'): void {
    if (roleType === 'Admin') {
      this.loginForm.setValue({
        userId: 'admin01',
        password: 'Admin@123',
        role: 'Admin'
      });
    } else {
      this.loginForm.setValue({
        userId: 'user01',
        password: 'User@123',
        role: 'General User'
      });
    }
    this.onSubmit();
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;
    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Authentication failed. Please check credentials.';
      }
    });
  }
}