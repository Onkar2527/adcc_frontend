import { Routes } from '@angular/router';
import { AppLayout } from './shell/layout/component/app.layout';
import { authGuard } from './core/guards/auth.guard';
import { LoanApplicationComponent } from './features/proposals/forms-proposal/loan-application/loan-application';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: '',
    component: AppLayout,
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', loadComponent: () => import('./features/dashboard/dashboard').then(mod => mod.Dashboard) },
      { path: 'proposals', loadComponent: () => import('./features/proposals/proposals').then(mod => mod.Proposals) },
      { path: 'admin', loadChildren: () => import('./features/admin/admin.routes').then(mod => mod.ADMIN_ROUTES) },
      { path: 'loanapplication', loadComponent: () => import('./features/proposals/forms-proposal/loan-application/loan-application').then(mod => mod.LoanApplicationComponent) },
      { path: 'branchscrutiny', loadComponent: () => import('./features/proposals/forms-proposal/loan-application/loan-application').then(mod => mod.LoanApplicationComponent) },
      { path: 'employees', redirectTo: '/admin/employee-master', pathMatch: 'full' },
      { path: 'password-policy', redirectTo: '/admin/password-policy-master', pathMatch: 'full' },
      { path: 'auditor', loadChildren: () => import('./features/auditor/auditor.routes').then(mod => mod.AUDITOR_ROUTES) },
      { path: 'reports', loadComponent: () => import('./features/reports/reports.component').then(mod => mod.ReportsComponent) },
      { path: 'reports/detail', loadComponent: () => import('./features/reports/reports-detail-placeholder.component').then(mod => mod.ReportsDetailPlaceholderComponent) },
      { path: 'reports/:reportSlug', loadComponent: () => import('./features/reports/report-viewer/report-viewer.component').then(mod => mod.ReportViewerComponent) },
    ]
  },
  { 
    path: 'login', 
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent) 
  },
  { 
    path: 'forgot-password', 
    loadComponent: () => import('./features/auth/forgot-password.component').then(m => m.ForgotPasswordComponent) 
  },
  {
    path: 'auth/reset-password',
    loadComponent: () => import('./features/auth/reset-password.component').then(m => m.ResetPasswordComponent),
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: '/home' },
];
