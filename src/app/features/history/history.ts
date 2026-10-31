import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Sidebar } from '../../layout/sidebar/sidebar';
import { OrderService, OrderDto } from '../../core/services/order';
import { RoleService } from '../../core/services/role.service';
import { cleanVehicleTitle } from '../../core/utils/vehicle-utils';

import { IconComponent } from '../../shared/ui/icon/icon.component';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, RouterModule, Sidebar, FormsModule, IconComponent],
  templateUrl: './history.html',
  styleUrl: './history.css'
})
export class History implements OnInit {
  orders: OrderDto[] = [];
  currentUser: any = null;
  isLoading = true;
  errorMessage = '';

  searchTerm = '';
  selectedFilter = 'MI_ETAPA'; // 'MI_ETAPA' = historial de los que pasaron por mi etapa | 'TODOS'

  selectedPhoto: string | null = null;

  constructor(
    private orderService: OrderService,
    private cdr: ChangeDetectorRef,
    public roleService: RoleService
  ) {}

  ngOnInit(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.currentUser = JSON.parse(userStr);
    } else {
      this.currentUser = { role: 'SUPER_ADMIN', username: 'Admin' };
    }

    // Super admins see all by default
    if (this.isSuperAdmin) {
      this.selectedFilter = 'TODOS';
    }

    this.orderService.getAll().subscribe({
      next: (data) => {
        this.orders = data;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorMessage = 'No se pudo conectar con el servidor para cargar el historial.';
        this.isLoading = false;
        this.cdr.markForCheck();
        console.error('Error cargando historial:', err);
      }
    });
  }

  get isSuperAdmin(): boolean {
    return this.roleService.isSuperAdmin(this.currentUser?.role);
  }

  get canCreateReception(): boolean {
    if (this.isSuperAdmin) return true;
    const r = this.roleService.normalizeRole(this.currentUser?.role);
    return r === 'RECEPCIONISTA' || r === 'GERENTE_COMERCIAL';
  }

  get roleLabel(): string {
    return this.roleService.getRoleLabel(this.currentUser?.role);
  }

  get assignedSteps(): number[] {
    return this.roleService.getAssignedSteps(this.currentUser?.role);
  }

  filtroEstado: 'TODOS' | 'ENTREGADOS' | 'EN_CURSO' = 'TODOS';

  get filteredOrders(): OrderDto[] {
    let result = this.orders;

    // Role-based filtering for history
    if (!this.isSuperAdmin && this.selectedFilter === 'MI_ETAPA') {
      const steps = this.assignedSteps;
      result = result.filter(o => {
        const isDelivered = o.estado.includes('Entregado') || o.estado.includes('Cerrado') || o.pasoActual >= 6;
        const passedOurStage = steps.some(s => o.pasoActual > s) || isDelivered;
        const currentlyAtOurStage = steps.includes(o.pasoActual);
        return passedOurStage || currentlyAtOurStage;
      });
    }

    // Filtro por estado: Entregados vs En Curso
    if (this.filtroEstado === 'ENTREGADOS') {
      result = result.filter(o => o.pasoActual >= 6 || o.estado.includes('Entregado') || o.estado.includes('Cerrado'));
    } else if (this.filtroEstado === 'EN_CURSO') {
      result = result.filter(o => o.pasoActual < 6 && !o.estado.includes('Entregado') && !o.estado.includes('Cerrado'));
    }

    // Filter by text search (incluyendo placa)
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      result = result.filter(o =>
        (o.placa && o.placa.toLowerCase().includes(term)) ||
        (o.vehiculo && o.vehiculo.toLowerCase().includes(term)) ||
        (o.cliente && o.cliente.toLowerCase().includes(term)) ||
        (o.id && o.id.toLowerCase().includes(term)) ||
        (o.estado && o.estado.toLowerCase().includes(term)) ||
        (o.observaciones && o.observaciones.toLowerCase().includes(term))
      );
    }

    // Sort by date descending (most recent first)
    return result.sort((a, b) =>
      new Date(b.fechaIngreso).getTime() - new Date(a.fechaIngreso).getTime()
    );
  }

  cleanTitle(vehiculo: string, placa?: string): string {
    return cleanVehicleTitle(vehiculo, placa);
  }

  setFiltroEstado(f: 'TODOS' | 'ENTREGADOS' | 'EN_CURSO') {
    this.filtroEstado = f;
  }

  get totalEntregados(): number {
    return this.orders.filter(o => o.pasoActual >= 6 || o.estado.includes('Entregado')).length;
  }

  get totalEnCurso(): number {
    return this.orders.filter(o => o.pasoActual < 6 && !o.estado.includes('Entregado')).length;
  }

  get totalMyStage(): number {
    if (this.isSuperAdmin) return this.orders.length;
    const steps = this.assignedSteps;
    return this.orders.filter(o => steps.some(s => o.pasoActual >= s)).length;
  }

  setFilter(filter: string) {
    this.selectedFilter = filter;
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

  getResponsablePaso(paso: number): string {
    const p = this.roleService.PASOS.find(s => s.id === paso);
    return p ? p.responsable : (paso >= 3 ? 'Gerente Comercial' : 'Equipo asignado');
  }

  openPhoto(photo: string, event: Event) {
    event.stopPropagation();
    this.selectedPhoto = photo;
  }

  closePhoto() {
    this.selectedPhoto = null;
  }
}
