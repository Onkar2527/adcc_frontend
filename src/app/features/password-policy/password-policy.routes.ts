import { Routes } from '@angular/router';

export const PASSWORD_POLICY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./password-policy-config/password-policy-config.component').then(m => m.PasswordPolicyConfigComponent)
  }
];
