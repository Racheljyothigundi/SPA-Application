import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private apiUrl = 'http://localhost:3000/api/admin';

  constructor(private http: HttpClient, private authService: AuthService) {}

  getUsers(): Observable<any> {
    const delay = this.authService.selectedDelay;
    return this.http.get<any>(`${this.apiUrl}/users?delay=${delay}`);
  }

  createUser(userData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/users?delay=${this.authService.selectedDelay}`, userData);
  }

  updateUserStatus(userId: string, status: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/users/${userId}/status`, { status });
  }

  deleteUser(userId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/users/${userId}`);
  }
}