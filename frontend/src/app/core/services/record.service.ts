import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class RecordService {
  private apiUrl = 'https://accessflow-backend-pi2a.onrender.com/api';

  constructor(private http: HttpClient, private authService: AuthService) {}

  getRecords(): Observable<any> {
    const delay = this.authService.selectedDelay;
    return this.http.get<any>(`${this.apiUrl}/records?delay=${delay}`);
  }

  getUserProfile(): Observable<any> {
    const delay = this.authService.selectedDelay;
    return this.http.get<any>(`${this.apiUrl}/users/me?delay=${delay}`);
  }
}
