import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth';
import { RoleService } from '../services/role.service';

/**
 * Guard flexible basado en roles para rutas protegidas
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const roleService = inject(RoleService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  const user = auth.getCurrentUser();
  const userRole = roleService.normalizeRole(user?.role);

  // Super Admin siempre tiene acceso
  if (userRole === 'SUPER_ADMIN') {
    return true;
  }

  const allowedRoles = (route.data?.['roles'] as string[]) || ['SUPER_ADMIN', 'GERENTE_COMERCIAL', 'ADMINISTRADOR'];

  const hasAccess = allowedRoles.some(r => roleService.normalizeRole(r) === userRole);

  if (hasAccess) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};
