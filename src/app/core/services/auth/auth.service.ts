import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../config/config.token';

export interface User {
  id: string;
  username: string;
  fullName: string;
  roleId: string | null;
  branchId: string | null;
  user_type_id?: string | number | null;
  password_policy?: number;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private config = inject(APP_CONFIG);
  private apiUrl = `${this.config.apiUrl}/auth`;

  /** Signal to track login status reactively */
  isLoggedIn = signal<boolean>(this.checkToken());

  /** Signal to store current user details */
  currentUser = signal<User | null>(this.getUserFromStorage());

  constructor() {}

  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => {
        if (res && !res.requires2fa) {
          localStorage.setItem('token', res.access_token);
          localStorage.setItem('user', JSON.stringify(res.user));
          this.isLoggedIn.set(true);
          this.currentUser.set(res.user);
        }
      })
    );
  }

  verify2fa(username: string, code: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/verify-2fa`, { username, code }).pipe(
      tap(res => {
        localStorage.setItem('token', res.access_token);
        localStorage.setItem('user', JSON.stringify(res.user));
        this.isLoggedIn.set(true);
        this.currentUser.set(res.user);
      })
    );
  }

  logout(): void {
    const user = this.currentUser();
    if (user && user.id) {
      this.http.post(`${this.apiUrl}/logout`, { employee_id: Number(user.id) }).subscribe({
        next: () => this.clearSessionAndRedirect(),
        error: () => this.clearSessionAndRedirect()
      });
    } else {
      this.clearSessionAndRedirect();
    }
  }

  private clearSessionAndRedirect(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.isLoggedIn.set(false);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  private checkToken(): boolean {
    return !!localStorage.getItem('token');
  }

  private getUserFromStorage(): User | null {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
}
