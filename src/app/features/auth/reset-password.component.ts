import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../core/services/auth/auth.service';
import { PasswordPolicyService } from '../admin/services/masters.service';
import { APP_CONFIG } from '../../core/services/config/config.token';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PasswordModule,
    ButtonModule,
    Toast
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>
    <div class="login-page">
      <!-- Fixed Banner -->
      <div class="top-banner">
        <div class="glow-node node-1"></div>
        <div class="glow-node node-2"></div>
        <div class="glow-node node-3"></div>
      </div>

      <!-- Background Floating Shapes -->
      <div class="bg-shape shape-1"></div>
      <div class="bg-shape shape-2"></div>
      <div class="bg-shape shape-3"></div>

      <!-- Content -->
      <div class="content-section">
        <div class="brand-section animate-item">
          <h1>AuditPro</h1>
          <p>RISK BASED INTERNAL AUDIT</p>
        </div>

        <div class="login-wrapper">
          <div class="login-card animate-item delay-1" style="max-width: 450px;">
            <h2>Reset Password Required</h2>
            <p class="login-text" *ngIf="passwordPolicy === 1">Password policy changed, so reset your password.</p>
            <p class="login-text" *ngIf="passwordPolicy !== 1">Your password must be changed to comply with the latest security policy.</p>
            <div class="company-name" style="margin-bottom: 1rem;">Employee: <strong>{{ username }}</strong></div>
            <div class="divider"></div>

            <form #resetForm="ngForm" (ngSubmit)="onSubmit()" autocomplete="off">
              <!-- New Password -->
              <div class="input-group">
                <label for="newPassword">New Password</label>
                <p-password
                  inputId="newPassword"
                  [ngModel]="newPassword()"
                  (ngModelChange)="onPasswordChange($event)"
                  name="newPassword"
                  [toggleMask]="true"
                  [feedback]="false"
                  placeholder="Enter New Password"
                  styleClass="w-full"
                  inputStyleClass="w-full custom-input"
                  required
                >
                </p-password>
              </div>

              <!-- Confirm Password -->
              <div class="input-group" style="margin-top: 1rem;">
                <label for="confirmPassword">Confirm Password</label>
                <p-password
                  inputId="confirmPassword"
                  [ngModel]="confirmPassword()"
                  (ngModelChange)="onConfirmPasswordChange($event)"
                  name="confirmPassword"
                  [toggleMask]="true"
                  [feedback]="false"
                  placeholder="Confirm New Password"
                  styleClass="w-full"
                  inputStyleClass="w-full custom-input"
                  required
                >
                </p-password>
              </div>

              <!-- Password Guidelines list -->
              <div class="policy-guidelines" style="margin-top: 1.5rem; text-align: left; font-size: 0.85rem; color: #475569;">
                <h4 style="margin: 0 0 0.5rem 0; font-size: 0.9rem; font-weight: 600; color: #1e293b;">Password Requirements:</h4>
                <ul style="list-style-type: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.25rem;">
                  <li [style.color]="hasMinLength() ? '#10b981' : '#ef4444'" style="display: flex; align-items: center; gap: 0.5rem;">
                    <i [class]="hasMinLength() ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
                    At least {{ minLength }} characters long (currently: {{ newPassword().length }})
                  </li>
                  <li *ngIf="uppercaseCnt > 0" [style.color]="hasUppercase() ? '#10b981' : '#ef4444'" style="display: flex; align-items: center; gap: 0.5rem;">
                    <i [class]="hasUppercase() ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
                    Contains at least {{ uppercaseCnt }} uppercase letter(s)
                  </li>
                  <li *ngIf="lowercaseCnt > 0" [style.color]="hasLowercase() ? '#10b981' : '#ef4444'" style="display: flex; align-items: center; gap: 0.5rem;">
                    <i [class]="hasLowercase() ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
                    Contains at least {{ lowercaseCnt }} lowercase letter(s)
                  </li>
                  <li *ngIf="numCnt > 0" [style.color]="hasNumbers() ? '#10b981' : '#ef4444'" style="display: flex; align-items: center; gap: 0.5rem;">
                    <i [class]="hasNumbers() ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
                    Contains at least {{ numCnt }} number(s)
                  </li>
                  <li *ngIf="symbolCnt > 0" [style.color]="hasSymbols() ? '#10b981' : '#ef4444'" style="display: flex; align-items: center; gap: 0.5rem;">
                    <i [class]="hasSymbols() ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
                    Contains at least {{ symbolCnt }} special character(s)
                  </li>
                </ul>
              </div>

              <!-- Submit Button -->
              <button
                pButton
                type="submit"
                [label]="submitting() ? 'Resetting...' : 'Update Password'"
                [loading]="submitting()"
                [disabled]="submitting() || !isFormValid()"
                class="login-btn"
                style="margin-top: 1.5rem; width: 100%;"
              ></button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./login.component.css']
})
export class ResetPasswordComponent implements OnInit {
  private authService = inject(AuthService);
  private policyService = inject(PasswordPolicyService);
  private messageService = inject(MessageService);
  private router = inject(Router);
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);

  username = '';
  newPassword = signal('');
  confirmPassword = signal('');

  minLength = 8;
  numCnt = 1;
  uppercaseCnt = 1;
  lowercaseCnt = 1;
  symbolCnt = 1;

  submitting = signal(false);

  // Checks
  hasMinLength = signal(false);
  hasUppercase = signal(false);
  hasLowercase = signal(false);
  hasNumbers = signal(false);
  hasSymbols = signal(false);

  isFormValid = computed(() => {
    return this.hasMinLength() &&
      this.hasUppercase() &&
      this.hasLowercase() &&
      this.hasNumbers() &&
      this.hasSymbols() &&
      this.newPassword() === this.confirmPassword() &&
      this.newPassword().trim().length > 0;
  });

  passwordPolicy = 0;

  ngOnInit() {
    const user = this.authService.currentUser() as any;
    if (user) {
      this.username = user.username || user.emp_code || '';
      this.passwordPolicy = user.password_policy !== undefined ? Number(user.password_policy) : 0;
    } else {
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsed = JSON.parse(userData);
        this.username = parsed.username || parsed.emp_code || '';
        this.passwordPolicy = parsed.password_policy !== undefined ? Number(parsed.password_policy) : 0;
      }
    }

    this.loadPolicy();
  }

  loadPolicy() {
    this.policyService.getPolicy().subscribe({
      next: (policy) => {
        if (policy) {
          this.minLength = Number(policy.min_length) || 8;
          this.numCnt = Number(policy.num_cnt) || 0;
          this.uppercaseCnt = Number(policy.uppercase_cnt) || 0;
          this.lowercaseCnt = Number(policy.lowercase_cnt) || 0;
          this.symbolCnt = Number(policy.symbol_cnt) || 0;
          this.onPasswordChange(this.newPassword());
        }
      }
    });
  }

  onPasswordChange(val: string) {
    const password = val || '';
    this.newPassword.set(password);
    this.hasMinLength.set(password.length >= this.minLength);
    this.hasUppercase.set((password.match(/[A-Z]/g) || []).length >= this.uppercaseCnt);
    this.hasLowercase.set((password.match(/[a-z]/g) || []).length >= this.lowercaseCnt);
    this.hasNumbers.set((password.match(/[0-9]/g) || []).length >= this.numCnt);
    
    const symbolMatches = password.match(/[!@#$%^&*(),.?":{}|<>_\-+=/\\[\];'`~]/g) || [];
    this.hasSymbols.set(symbolMatches.length >= this.symbolCnt);
  }

  onConfirmPasswordChange(val: string) {
    this.confirmPassword.set(val || '');
  }

  onSubmit() {
    if (!this.isFormValid()) {
      if (this.newPassword() !== this.confirmPassword()) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Mismatch',
          detail: 'Passwords do not match'
        });
      }
      return;
    }

    this.submitting.set(true);
    const url = `${this.config.apiUrl}/auth/reset-password`;

    this.http.post(url, {
      username: this.username,
      newPassword: this.newPassword()
    }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Password reset successfully'
        });

        // Update local session user policy flag to 0 (compliant)
        const userData = localStorage.getItem('user');
        if (userData) {
          const parsed = JSON.parse(userData);
          parsed.password_policy = 0;
          localStorage.setItem('user', JSON.stringify(parsed));
          this.authService.currentUser.set(parsed);
        }

        setTimeout(() => {
          this.router.navigate([this.getDashboardRoute()]);
        }, 1000);
      },
      error: (err) => {
        this.submitting.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Failed',
          detail: err?.error?.message || 'Failed to reset password. Please try again.'
        });
      }
    });
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
}
