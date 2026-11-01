import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { Sidebar } from '../../layout/sidebar/sidebar';
import { OrderService, OrderDto } from '../../core/services/order';
import { RoleService } from '../../core/services/role.service';
import { cleanVehicleTitle } from '../../core/utils/vehicle-utils';

import { IconComponent } from '../../shared/ui/icon/icon.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, Sidebar, FormsModule, IconComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  orders: OrderDto[] = [];
  currentUser: any = null;
  searchTerm: string = '';
  isLoading = true;
  errorMessage = '';

  // 'MI_ETAPA': sólo los que le faltan a su etapa | 'TODOS': todas las órdenes activas
  filterScope: 'MI_ETAPA' | 'TODOS' = 'MI_ETAPA';

  showAllStagesModal = false;

  stats = {
    activos: 0,
    pendientes: 0,
    entregadosHoy: 0,
    enMiEtapa: 0
  };

  constructor(
    private orderService: OrderService,
    public roleService: RoleService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.currentUser = JSON.parse(userStr);
    } else {
      this.currentUser = { role: 'SUPER_ADMIN', username: 'Admin' };
    }

    const queryFilter = this.route.snapshot.queryParamMap.get('filter');
    if (queryFilter === 'MI_ETAPA') {
      this.filterScope = 'MI_ETAPA';
    } else if (this.isSuperAdmin) {
      this.filterScope = 'TODOS';
    } else {
      this.filterScope = 'MI_ETAPA';
    }

    this.loadOrders();
  }

  get isSuperAdmin(): boolean {
    return this.roleService.isSuperAdmin(this.currentUser?.role);
  }

  get canCreateReception(): boolean {
    if (this.isSuperAdmin) return true;
    const r = this.roleService.normalizeRole(this.currentUser?.role);
    return r === 'RECEPCIONISTA' || r === 'GERENTE_COMERCIAL';
  }

  get roleTitle(): string {
    return this.roleService.getRoleLabel(this.currentUser?.role);
  }

  get roleBadge() {
    return this.roleService.getRoleBadge(this.currentUser?.role);
  }

  get roleDescription(): string {
    return this.roleService.getRoleDescription(this.currentUser?.role);
  }

  get assignedSteps(): number[] {
    return this.roleService.getAssignedSteps(this.currentUser?.role);
  }

  isOrderForCurrentUser(order: OrderDto): boolean {
    return this.roleService.isOrderPendingForRole(order.pasoActual, this.currentUser?.role);
  }

  getOrdersCountByStep(step: number): number {
    return this.orders.filter(o => o.pasoActual === step).length;
  }

  getResponsablePaso(pasoId: number): string {
    const paso = this.roleService.PASOS.find(p => p.id === pasoId);
    return paso?.responsable || 'Personal asignado';
  }

  loadOrders(): void {
    this.isLoading = true;
    this.orderService.getAll().subscribe({
      next: (data) => {
        this.orders = data;
        this.computeStats();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorMessage = 'No se pudo conectar con el servidor. Verifique que el backend esté corriendo en localhost:3000';
        this.isLoading = false;
        this.cdr.markForCheck();
        console.error('Error cargando órdenes:', err);
      }
    });
  }

  get filteredOrders(): OrderDto[] {
    let result = this.orders;

    // 1. Filtrado por rol / etapa
    if (!this.isSuperAdmin && this.filterScope === 'MI_ETAPA') {
      result = result.filter(order =>
        this.roleService.isOrderPendingForRole(order.pasoActual, this.currentUser?.role) &&
        !order.estado.includes('Entregado') &&
        !order.estado.includes('Cerrado')
      );
    } else {
      // Excluir cerrados del dashboard general activo
      result = result.filter(o => !o.estado.includes('Entregado') && !o.estado.includes('Cerrado'));
    }

    // 2. Búsqueda por texto (incluyendo placa)
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      result = result.filter(order =>
        (order.placa && order.placa.toLowerCase().includes(term)) ||
        (order.vehiculo && order.vehiculo.toLowerCase().includes(term)) ||
        (order.cliente && order.cliente.toLowerCase().includes(term)) ||
        (order.id && order.id.toLowerCase().includes(term)) ||
        (order.estado && order.estado.toLowerCase().includes(term)) ||
        (order.observaciones && order.observaciones.toLowerCase().includes(term))
      );
    }

    return result;
  }

  cleanTitle(vehiculo: string, placa?: string): string {
    return cleanVehicleTitle(vehiculo, placa);
  }

  setFilterScope(scope: 'MI_ETAPA' | 'TODOS'): void {
    this.filterScope = scope;
  }

  computeStats(): void {
    const role = this.currentUser?.role;
    this.stats.activos = this.orders.filter(o => !o.estado.includes('Entregado') && !o.estado.includes('Cerrado')).length;
    this.stats.pendientes = this.orders.filter(o => o.estado.includes('Pendiente')).length;
    this.stats.enMiEtapa = this.orders.filter(o =>
      this.roleService.isOrderPendingForRole(o.pasoActual, role) &&
      !o.estado.includes('Entregado') &&
      !o.estado.includes('Cerrado')
    ).length;
    this.stats.entregadosHoy = this.orders.filter(o => {
      const fecha = new Date(o.fechaIngreso);
      const hoy = new Date();
      return o.estado.includes('Entregado') && fecha.toDateString() === hoy.toDateString();
    }).length;
  }

  getProgressLabel(pasoActual: number): string {
    switch (pasoActual) {
      case 1:
        return 'Recibido';
      case 2:
        return 'Pendiente por cotización';
      default:
        return 'Entregado';
    }
  }

  getEstadoClass(estado: string): string {
    if (estado.includes('completad') || estado.includes('Entregado') || estado.includes('Cerrado')) return 'badge-success';
    if (estado.includes('Pendiente')) return 'badge-warning';
    if (estado.includes('proceso')) return 'badge-primary';
    return 'badge-outline';
  }

  getPasoLabel(paso: number): string {
    switch (paso) {
      case 1: return '1. Checklist Ingreso';
      case 2: return '2. Cotización & Factura';
      default: return 'Entregado y Cerrado';
    }
  }

  getAsignadoActual(order: OrderDto): string {
    switch (order.pasoActual) {
      case 1:
        return order.recepcionista || 'Alejandro Gómez (Recepción)';
      case 2:
        return order.responsableEtapa2 || 'Roberto Gómez (Gerente)';
      default:
        return 'Entregado y Cerrado';
    }
  }
}
