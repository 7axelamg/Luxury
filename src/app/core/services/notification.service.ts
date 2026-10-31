import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { OrderService, OrderDto } from './order';
import { RoleService } from './role.service';

export interface NotificationSummary {
  pendingCount: number;
  myStepCount: number;
  urgentCount: number;
  label: string;
  myPendingOrders: OrderDto[];
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private _summary$ = new BehaviorSubject<NotificationSummary>({
    pendingCount: 0,
    myStepCount: 0,
    urgentCount: 0,
    label: '',
    myPendingOrders: []
  });

  summary$ = this._summary$.asObservable();

  get snapshot(): NotificationSummary {
    return this._summary$.getValue();
  }

  constructor(
    private orderService: OrderService,
    private roleService: RoleService
  ) {}

  refresh(role?: string): void {
    this.orderService.getAll().subscribe({
      next: (orders: OrderDto[]) => {
        const active = orders.filter(o =>
          !o.estado.includes('Entregado') && !o.estado.includes('Cerrado')
        );

        const myPendingOrders = this.roleService.isSuperAdmin(role)
          ? active
          : active.filter(o =>
              this.roleService.isOrderPendingForRole(o.pasoActual, role)
            );

        const myStepCount = myPendingOrders.length;
        const urgentCount = active.filter(o => o.pasoActual === 1).length;
        const label = this.getPendingLabel(myStepCount, role);

        this._summary$.next({
          pendingCount: active.length,
          myStepCount,
          urgentCount,
          label,
          myPendingOrders
        });
      },
      error: () => { /* Silently fail */ }
    });
  }

  private getPendingLabel(count: number, role?: string): string {
    const r = this.roleService.normalizeRole(role);
    const noun = count === 1 ? 'trabajo' : 'trabajos';
    if (count === 0) return '¡Todo al día!';
    if (r === 'RECEPCIONISTA') return `${count} vehículo${count > 1 ? 's' : ''} por revisar`;
    if (r === 'LUBRICADOR' || r === 'TECNICO') return `${count} ${noun} por atender`;
    if (r === 'GERENTE_COMERCIAL') return `${count} ${noun} por gestionar`;
    if (r === 'JEFE_DE_PATIO') return `${count} ${noun} activos en patio`;
    return `${count} ${noun} por revisar`;
  }
}
