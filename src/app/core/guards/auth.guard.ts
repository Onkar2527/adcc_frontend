import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.getToken()) {
    const user = authService.currentUser();
    if (user && user.password_policy === 1) {
      if (state.url === '/auth/reset-password') {
        return true;
      }
      router.navigate(['/auth/reset-password']);
      return false;
    } else {
      if (state.url === '/auth/reset-password') {
        router.navigate(['/home']);
        return false;
      }
    }
    return true;
  }

  // Redirect to login page with return url
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
