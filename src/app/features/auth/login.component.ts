import { Component, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../core/services/auth/auth.service';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';

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

  loading = signal(false);
  error = signal<string | undefined>(undefined);

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

  @HostListener('document:mousemove', ['$event'])
  handleMouseMove(event: MouseEvent) {
    const page = document.querySelector('.login-page') as HTMLElement;
    if (page) {
      const rect = page.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      page.style.setProperty('--mouse-x', `${x}px`);
      page.style.setProperty('--mouse-y', `${y}px`);
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
      password: this.password
    }).subscribe({
      next: () => {
        this.loading.set(false);

        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Login successful'
        });

        setTimeout(() => {
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';
          this.router.navigate([returnUrl]);
        }, 1000);
      },
      error: (err) => {
        this.loading.set(false);

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'Login failed'
        });
      }
    });
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
}