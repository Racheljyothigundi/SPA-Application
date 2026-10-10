import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();
  
  public selectedDelay = 0;

  constructor(private http: HttpClient, private router: Router) {}

  private getUserFromStorage(): User | null {
    const userJson = localStorage.getItem('accessflow_user');
    return userJson ? JSON.parse(userJson) : null;
  }

  login(credentials: { userId: string; password?: string; role?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login?delay=${this.selectedDelay}`, credentials).pipe(
      tap(res => {
        if (res.success && res.token) {
          localStorage.setItem('accessflow_token', res.token);
          localStorage.setItem('accessflow_user', JSON.stringify(res.user));
          this.currentUserSubject.next(res.user);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('accessflow_token');
    localStorage.removeItem('accessflow_user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('accessflow_token');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'Admin';
  }
}
