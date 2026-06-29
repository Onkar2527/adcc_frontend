import { Component, HostListener, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../core/services/auth/auth.service';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { ENABLE_2FA } from '../admin/services/required-data';
import { PasswordPolicyService } from '../admin/services/masters.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    Toast
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private messageService = inject(MessageService);

  username = '';
  password = '';
  rememberMe = false;
  selectedRole: 'auditor' | 'reviewer' | 'manager' | undefined;

  showOtpScreen = false;
  otpCode = '';
  maskedEmail = '';
  loadingOtp = signal(false);
  enable2fa = ENABLE_2FA;

  loading = signal(false);
  error = signal<string | undefined>(undefined);

  // Reset password state
  showResetScreen = signal(false);

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.ctrlKey && event.key.toLowerCase() === 'k') {
      event.preventDefault();

      this.username = 'ADMIN';
      this.password = 'Emp@2024';
      this.selectedRole = undefined;

      this.onLogin();
    }
  }

  onLogin() {
    if (this.loading()) return;

    if (!this.username || !this.password) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Required',
        detail: 'Please enter employee code and password'
      });
      return;
    }

    this.loading.set(true);
    this.error.set(undefined);

    this.authService.login({
      username: this.username,
      password: this.password,
      enable_2fa: this.enable2fa
    }).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        console.log('Login response:', res);

        if (res && res.requires2fa) {
          this.maskedEmail = res.emailMasked;
          this.showOtpScreen = true;
          this.otpCode = '';
          this.messageService.add({
            severity: 'info',
            summary: 'Verification Required',
            detail: 'A verification code has been sent to your email.'
          });
          return;
        }

        this.handleSuccessfulLogin();
      },
      error: (err) => {
        this.loading.set(false);
        const errorMessage = err?.error?.message || 'Invalid employee code or password. Please check your details and try again.';
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage
        });
      }
    });
  }

  onVerifyOtp() {
    if (this.loadingOtp()) return;

    if (!this.otpCode || this.otpCode.length !== 6) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Required',
        detail: 'Please enter the 6-digit verification code'
      });
      return;
    }

    this.loadingOtp.set(true);

    this.authService.verify2fa(this.username, this.otpCode).subscribe({
      next: (res: any) => {
        this.loadingOtp.set(false);
        this.handleSuccessfulLogin();
      },
      error: (err) => {
        this.loadingOtp.set(false);
        const errorMessage = err?.error?.message || 'Invalid or expired verification code. Please try again.';
        this.messageService.add({
          severity: 'error',
          summary: 'Verification Failed',
          detail: errorMessage
        });
      }
    });
  }

  cancelOtp() {
    this.showOtpScreen = false;
    this.otpCode = '';
  }

  private handleSuccessfulLogin() {
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Login successful'
    });

    setTimeout(() => {
      const userData = localStorage.getItem('user') || '{}';
      const user = JSON.parse(userData);

      if (user && user.password_policy === 1) {
        this.router.navigate(['/auth/reset-password']);
        return;
      }

      const returnUrl = this.route.snapshot.queryParams['returnUrl'];

      if (returnUrl) {
        this.router.navigate([returnUrl]);
        return;
      }

      this.router.navigate([this.getDashboardRoute()]);
    }, 700);
  }

  private getDashboardRoute(): string {
    const userData = localStorage.getItem('user') || '{}';
    const user = JSON.parse(userData);

    const userTypeId = Number(user.user_type_id || 0);

    switch (userTypeId) {
      case 1:
        return '/admin';

      case 2:
        return '/auditor/audit-dashboard';

      case 6:
        return '/reports';

      case 3:
        return '/auditor/compliance';

      case 4:
        return '/auditor/reviewer';

      default:
        return '/home';
    }
  }

  setCredentials(type: 'auditor' | 'reviewer' | 'manager') {
    if (this.loading()) return;

    this.selectedRole = type;

    if (type === 'auditor') {
      this.username = '132';
      this.password = 'Emp@2024';
    } else if (type === 'reviewer') {
      this.username = '139';
      this.password = 'Emp@2024';
    } else if (type === 'manager') {
      this.username = '140';
      this.password = 'Emp@2024';
    }

    this.onLogin();
  }

  goToForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }
}
