import { Injectable, inject, signal, NgZone } from '@angular/core';
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
  private zone = inject(NgZone);
  private apiUrl = `${this.config.apiUrl}/auth`;

  private authChannel = new BroadcastChannel('auth_channel');
  private inactivityInterval: any;
  private lastActivityUpdateTime = 0;
  private readonly TIMEOUT_MS = 40 * 60 * 1000; // 40 minutes
  private cleanupListeners?: () => void;

  /** Signal to track login status reactively */
  isLoggedIn = signal<boolean>(this.checkToken());

  /** Signal to store current user details */
  currentUser = signal<User | null>(this.getUserFromStorage());

  constructor() {
    // If they are logged in on startup, start the inactivity timer
    if (this.isLoggedIn()) {
      this.startInactivityTimer();
    }

    // Listen to broadcasted logout messages from other tabs
    this.zone.runOutsideAngular(() => {
      this.authChannel.onmessage = (event) => {
        if (event.data?.type === 'logout') {
          this.zone.run(() => {
            this.clearSessionAndRedirect();
          });
        }
      };
    });
  }

  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => {
        if (res && !res.requires2fa) {
          localStorage.setItem('token', res.access_token);
          localStorage.setItem('user', JSON.stringify(res.user));
          this.isLoggedIn.set(true);
          this.currentUser.set(res.user);
          this.startInactivityTimer();
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
        this.startInactivityTimer();
      })
    );
  }

  sendResetPasswordOtp(username: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/forgot-password/send-otp`, { username });
  }

  verifyResetPasswordOtpAndReset(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/forgot-password/verify-otp-and-reset`, payload);
  }

  resetPasswordByLastPassword(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/forgot-password/reset-by-last-password`, payload);
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
    this.stopInactivityTimer();

    // Check if we still have token to avoid infinite loop of broadcasting
    const token = localStorage.getItem('token');
    if (token) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('lastActivity');
      // Notify other tabs
      this.authChannel.postMessage({ type: 'logout' });
    }

    this.isLoggedIn.set(false);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  private startInactivityTimer(): void {
    this.zone.runOutsideAngular(() => {
      this.stopInactivityTimer();

      // Set initial last activity time if not set
      if (!localStorage.getItem('lastActivity')) {
        localStorage.setItem('lastActivity', Date.now().toString());
      }

      // Check inactivity status every 10 seconds
      this.inactivityInterval = setInterval(() => {
        const lastActivity = Number(localStorage.getItem('lastActivity') || 0);
        const token = localStorage.getItem('token');

        if (!token || !lastActivity || (Date.now() - lastActivity > this.TIMEOUT_MS)) {
          this.zone.run(() => {
            this.logout();
          });
        }
      }, 10000);

      const onActivity = () => {
        const now = Date.now();
        // Throttle localStorage updates to at most once every 5 seconds
        if (now - this.lastActivityUpdateTime > 5000) {
          this.lastActivityUpdateTime = now;
          localStorage.setItem('lastActivity', now.toString());
        }
      };

      const events = ['mousemove', 'keypress', 'click', 'scroll', 'touchstart'];
      events.forEach(event => {
        window.addEventListener(event, onActivity, { passive: true });
      });

      this.cleanupListeners = () => {
        events.forEach(event => {
          window.removeEventListener(event, onActivity);
        });
      };
    });
  }

  private stopInactivityTimer(): void {
    if (this.inactivityInterval) {
      clearInterval(this.inactivityInterval);
      this.inactivityInterval = null;
    }
    if (this.cleanupListeners) {
      this.cleanupListeners();
      this.cleanupListeners = undefined;
    }
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
