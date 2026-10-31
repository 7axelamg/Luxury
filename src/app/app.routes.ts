import { Routes } from '@angular/router';
import { Login } from './features/login/login';
import { Dashboard } from './features/dashboard/dashboard';
import { Reception } from './features/reception/reception';
import { OrderDetail } from './features/order-detail/order-detail';
import { History } from './features/history/history';
import { EmployeesComponent } from './features/employees/employees.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'reception', component: Reception, canActivate: [authGuard] },
  { path: 'order/:id', component: OrderDetail, canActivate: [authGuard] },
  { path: 'history', component: History, canActivate: [authGuard] },
  {
    path: 'employees',
    component: EmployeesComponent,
    canActivate: [roleGuard],
    data: { roles: ['SUPER_ADMIN', 'GERENTE_COMERCIAL', 'ADMINISTRADOR'] }
  },
  { path: '**', redirectTo: 'dashboard' }
];
