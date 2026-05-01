import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../core/services/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    InputTextModule, 
    PasswordModule, 
    ButtonModule, 
    CheckboxModule,
    MessageModule
  ],
  template: `
    <div class="login-container flex align-items-center justify-content-center min-h-screen p-4">
      <div class="login-card p-6 shadow-8 border-round-xl bg-white w-full max-w-25rem">
        <div class="text-center mb-5">
          <div class="inline-flex align-items-center justify-content-center bg-primary-100 border-circle w-4rem h-4rem mb-3">
            <i class="pi pi-lock text-primary-600 text-3xl"></i>
          </div>
          <h2 class="text-3xl font-bold text-900 m-0">Kredpool</h2>
          <p class="text-600 font-medium mt-2">Sign in to continue</p>
        </div>

        <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
          <div class="flex flex-column gap-4 mb-4">
            <div class="flex flex-column gap-2">
              <label for="username" class="font-medium text-900">Username</label>
              <span class="p-input-icon-left">
                <i class="pi pi-user"></i>
                <input 
                  type="text" 
                  pInputText 
                  id="username" 
                  name="username" 
                  [(ngModel)]="username" 
                  placeholder="Enter your username" 
                  class="w-full h-3rem"
                  required />
              </span>
            </div>

            <div class="flex flex-column gap-2">
              <label for="password" class="font-medium text-900">Password</label>
              <p-password 
                id="password" 
                name="password" 
                [(ngModel)]="password" 
                [toggleMask]="true" 
                [feedback]="false" 
                placeholder="Enter your password" 
                styleClass="w-full" 
                inputStyleClass="w-full h-3rem"
                required>
              </p-password>
            </div>
          </div>

          <div class="flex align-items-center justify-content-between mb-5">
            <div class="flex align-items-center gap-2">
              <p-checkbox name="remember" [(ngModel)]="rememberMe" [binary]="true"></p-checkbox>
              <label for="remember" class="text-700 cursor-pointer">Remember me</label>
            </div>
            <a class="text-primary-600 font-medium cursor-pointer no-underline hover:underline">Forgot password?</a>
          </div>

          @if (error()) {
            <p-message severity="error" [text]="error() || ''" class="w-full mb-4"></p-message>
          }

          <p-button 
            type="submit" 
            label="Sign In" 
            class="w-full" 
            styleClass="w-full h-3.5rem text-xl font-bold border-round-lg shadow-2"
            [loading]="loading()"
            [disabled]="!username || !password">
          </p-button>
        </form>

        <p class="text-center text-600 mt-5">
            Don't have an account? 
            <a class="text-primary-600 font-medium cursor-pointer no-underline hover:underline">Contact Admin</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      background: linear-gradient(135deg, var(--primary-50) 0%, var(--surface-100) 100%);
      background-attachment: fixed;
    }

    .login-card {
      border: 1px solid var(--surface-200);
      transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
      
      &:hover {
        transform: translateY(-4px);
        box-shadow: 0px 20px 25px -5px rgba(0, 0, 0, 0.1), 0px 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
      }
    }

    :host ::ng-deep {
      .p-inputtext:focus {
        border-color: var(--primary-600) !important;
        box-shadow: 0 0 0 0.2rem var(--primary-100) !important;
      }
      
      .p-password {
        width: 100%;
      }
    }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  username = '';
  password = '';
  rememberMe = false;
  
  loading = signal(false);
  error = signal<string | undefined>(undefined);

  onSubmit() {
    if (!this.username || !this.password) return;

    this.loading.set(true);
    this.error.set(undefined);

    this.authService.login({
      username: this.username,
      password: this.password
    }).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';
        this.router.navigate([returnUrl]);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Authentication failed. Please check your credentials.');
        this.loading.set(false);
      }
    });
  }
}
