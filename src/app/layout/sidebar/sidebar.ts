import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { AuthService } from '../../core/services/auth';
import { RoleService } from '../../core/services/role.service';
import { NotificationService, NotificationSummary } from '../../core/services/notification.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar implements OnInit, OnDestroy {
  currentUser: { id: string; username: string; role: string } | null = null;
  notifications: NotificationSummary = { pendingCount: 0, myStepCount: 0, urgentCount: 0, label: '', myPendingOrders: [] };
  mobileOpen = false;
  showPendingModal = false;

  private sub?: Subscription;
  private routerSub?: Subscription;

  constructor(
    private authService: AuthService,
    public roleService: RoleService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();

    this.sub = this.notificationService.summary$.subscribe(s => {
      this.notifications = s;
    });

    this.notificationService.refresh(this.currentUser?.role);

    // Auto-close sidebar on navigation (mobile)
    this.routerSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => { 
        this.mobileOpen = false; 
        this.showPendingModal = false;
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.routerSub?.unsubscribe();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.mobileOpen = false;
    this.showPendingModal = false;
  }

  toggleMobile(): void {
    this.mobileOpen = !this.mobileOpen;
  }

  closeOverlay(): void {
    this.mobileOpen = false;
    this.showPendingModal = false;
  }

  togglePendingModal(): void {
    this.showPendingModal = !this.showPendingModal;
  }

  closePendingModal(): void {
    this.showPendingModal = false;
  }

  openOrder(orderId: string): void {
    this.showPendingModal = false;
    this.router.navigate(['/order', orderId]);
  }

  viewInDashboard(): void {
    this.showPendingModal = false;
    this.router.navigate(['/dashboard'], { queryParams: { filter: 'MI_ETAPA' } });
  }

  get roleTitle(): string {
    return this.roleService.getRoleLabel(this.currentUser?.role);
  }

  getPasoLabel(paso: number): string {
    switch (paso) {
      case 1: return '1. Checklist Ingreso';
      case 2: return '2. Cotización & Factura';
      default: return '✓ Entregado y Cerrado';
    }
  }

  get menuItems() {
    const r = this.roleService.normalizeRole(this.currentUser?.role);
    const items: { label: string; icon: string; route: string; badge?: number }[] = [
      {
        label: 'Tablero',
        icon: 'dashboard',
        route: '/dashboard',
        badge: this.notifications.myStepCount > 0 ? this.notifications.myStepCount : undefined
      }
    ];

    if (r === 'RECEPCIONISTA' || r === 'GERENTE_COMERCIAL' || r === 'ADMINISTRADOR' || r === 'SUPER_ADMIN' || r === 'ADMIN') {
      items.push({ label: 'Nueva Recepción', icon: 'add_circle', route: '/reception' });
    }

    items.push({ label: 'Historial', icon: 'history', route: '/history' });

    if (r === 'SUPER_ADMIN' || r === 'GERENTE_COMERCIAL' || r === 'ADMINISTRADOR') {
      items.push({ label: 'Empleados & Roles', icon: 'people', route: '/employees' });
    }

    return items;
  }

  getRoleBadge(role?: string): { label: string; icon: string; class: string } {
    return this.roleService.getRoleBadge(role);
  }

  logout() {
    this.authService.logout();
  }
}


