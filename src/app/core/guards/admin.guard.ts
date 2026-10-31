import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  const user = auth.getCurrentUser();
  const role = (user?.role || '').toUpperCase();
  if (role === 'ADMINISTRADOR' || role === 'SUPER_ADMIN' || role === 'ADMIN') {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};
