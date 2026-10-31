import { Injectable } from '@angular/core';

export interface StepDefinition {
  id: number;
  key: string;
  nombre: string;
  nombreCorto: string;
  icon: string;
  responsable: string;        // Quién ejecuta esta etapa
  roles: string[];            // Roles que pueden VER y GESTIONAR esta etapa
  advanceRoles: string[];     // Roles que pueden CERRAR/AVANZAR esta etapa
  descripcion: string;        // Qué debe hacer el usuario en esta etapa
}

@Injectable({
  providedIn: 'root'
})
export class RoleService {

  /**
   * Definición oficial del flujo de trabajo:
   * 1. Recepcionista → Revisión Exterior
   * 2. Técnico/Lubricador → Revisión Mecánica
   * 3. Técnico/Lubricador → Ejecución de trabajos mecánicos
  /**
   * Definición del flujo de trabajo simplificado en 2 PASOS:
   * 1. Recepcionista / Jefe Patio → Recepción & Checklist de Ingreso (6 Categorías)
   * 2. Gerente Comercial / Técnico → Cotización Checklist, Facturación Instantánea y Cierre
   */
  readonly PASOS: StepDefinition[] = [
    {
      id: 1,
      key: 'checklist',
      nombre: 'Recepción & Checklist de Ingreso',
      nombreCorto: '1. Checklist Ingreso',
      icon: 'clipboard',
      responsable: 'Recepcionista / Jefe de Patio',
      roles: ['RECEPCIONISTA', 'JEFE_DE_PATIO', 'ADMINISTRADOR', 'SUPER_ADMIN', 'GERENTE_COMERCIAL', 'TECNICO', 'LUBRICADOR'],
      advanceRoles: ['RECEPCIONISTA', 'JEFE_DE_PATIO', 'ADMINISTRADOR', 'SUPER_ADMIN', 'GERENTE_COMERCIAL'],
      descripcion: 'Inspección técnica al ingreso con checklist digital (B/SI, M/NO, N/A), pertenencias e inventario fotográfico.'
    },
    {
      id: 2,
      key: 'cotizacion',
      nombre: 'Cotización Checklist & Facturación',
      nombreCorto: '2. Cotización & Factura',
      icon: 'file-text',
      responsable: 'Gerente Comercial / Asesor',
      roles: ['GERENTE_COMERCIAL', 'ADMINISTRADOR', 'SUPER_ADMIN', 'JEFE_DE_PATIO', 'TECNICO', 'LUBRICADOR'],
      advanceRoles: ['GERENTE_COMERCIAL', 'ADMINISTRADOR', 'SUPER_ADMIN', 'JEFE_DE_PATIO'],
      descripcion: 'Checklist de servicios/repuestos con precios, liquidación instantánea, impresión de factura y entrega final.'
    }
  ];

  normalizeRole(role?: string): string {
    return (role || '').toUpperCase().trim().replace(/[\s-]+/g, '_');
  }

  /**
   * Super Admin (técnico) y Gerente Comercial tienen acceso total de gestión.
   */
  isSuperAdmin(role?: string): boolean {
    const r = this.normalizeRole(role);
    return (
      r === 'ADMINISTRADOR' ||
      r === 'SUPER_ADMIN' ||
      r === 'ADMIN' ||
      r === 'GERENTE_COMERCIAL'
    );
  }

  /**
   * Verifica si un rol puede AVANZAR un paso específico.
   * El Gerente Comercial puede finalizar TODAS las actas.
   */
  canAdvanceStep(pasoId: number, role?: string): boolean {
    if (this.isSuperAdmin(role)) return true;
    const paso = this.PASOS.find(p => p.id === pasoId);
    const r = this.normalizeRole(role);
    return paso?.advanceRoles.some(ar => this.normalizeRole(ar) === r) ?? false;
  }

  /**
   * Retorna los números de paso/etapa asignados a cada rol específico
   * (los que aparecen en su dashboard y su historial).
   */
  getAssignedSteps(role?: string): number[] {
    if (this.isSuperAdmin(role)) {
      return [1, 2];
    }
    const r = this.normalizeRole(role);
    if (r === 'LUBRICADOR' || r === 'TECNICO') {
      return [1, 2];
    }
    if (r === 'JEFE_DE_PATIO') {
      return [1, 2];
    }
    if (r === 'RECEPCIONISTA') {
      return [1];
    }
    return [1, 2];
  }

  /**
   * Determina si una orden está actualmente en la etapa activa del rol logueado.
   */
  isOrderPendingForRole(orderStep: number, role?: string): boolean {
    if (this.isSuperAdmin(role)) return true;
    const steps = this.getAssignedSteps(role);
    return steps.includes(orderStep);
  }

  /**
   * Determina si una orden forma parte del historial del rol logueado.
   */
  isOrderInHistoryForRole(orderStep: number, role?: string, isDelivered: boolean = false): boolean {
    if (this.isSuperAdmin(role)) return true;
    const steps = this.getAssignedSteps(role);
    const minStep = Math.min(...steps);
    return orderStep > minStep || isDelivered;
  }

  getRoleLabel(role?: string): string {
    const r = this.normalizeRole(role);
    switch (r) {
      case 'ADMINISTRADOR':
      case 'SUPER_ADMIN':
      case 'ADMIN':
        return 'Director / Super Admin';
      case 'GERENTE_COMERCIAL':
        return 'Gerente Comercial';
      case 'LUBRICADOR':
        return 'Especialista Lubricador';
      case 'TECNICO':
        return 'Técnico Especialista';
      case 'JEFE_DE_PATIO':
        return 'Jefe de Patio';
      case 'RECEPCIONISTA':
        return 'Recepcionista';
      default:
        return role || 'Operador';
    }
  }

  getRoleDescription(role?: string): string {
    const r = this.normalizeRole(role);
    switch (r) {
      case 'RECEPCIONISTA':
        return 'Realizas la revisión exterior al ingreso del vehículo (Etapa 1).';
      case 'LUBRICADOR':
        return 'Realizas la revisión mecánica y ejecución de trabajos mecánicos y lubricación (Etapas 2 y 3).';
      case 'TECNICO':
        return 'Realizas el diagnóstico mecánico y la ejecución de trabajos técnicos (Etapas 2 y 3).';
      case 'JEFE_DE_PATIO':
        return 'Supervisas la recepción exterior, revisión mecánica y ejecución de trabajos (Etapas 1, 2 y 3).';
      case 'GERENTE_COMERCIAL':
        return 'Gestionas la cotización con el cliente (Etapa 4 - Penúltima) y el control final con firma de actas (Etapa 5).';
      case 'ADMINISTRADOR':
      case 'SUPER_ADMIN':
      case 'ADMIN':
        return 'Acceso completo a todas las etapas y configuración del sistema.';
      default:
        return '';
    }
  }

  getRoleBadge(role?: string): { label: string; icon: string; class: string } {
    const r = this.normalizeRole(role);
    switch (r) {
      case 'ADMINISTRADOR':
      case 'SUPER_ADMIN':
      case 'ADMIN':
        return { label: 'Super Admin', icon: 'shield', class: 'badge-default' };
      case 'GERENTE_COMERCIAL':
        return { label: 'Gerente Comercial', icon: 'briefcase', class: 'badge-default' };
      case 'LUBRICADOR':
        return { label: 'Lubricador', icon: 'droplet', class: 'badge-default' };
      case 'TECNICO':
        return { label: 'Técnico', icon: 'settings', class: 'badge-default' };
      case 'JEFE_DE_PATIO':
        return { label: 'Jefe de Patio', icon: 'car', class: 'badge-default' };
      case 'RECEPCIONISTA':
        return { label: 'Recepcionista', icon: 'clipboard', class: 'badge-default' };
      default:
        return { label: role || 'Operador', icon: 'user', class: 'badge-default' };
    }
  }

  /**
   * Puede CREAR hallazgos: Técnico, Lubricador, Jefe de Patio y superiores.
   * El Recepcionista NO puede reportar hallazgos (solo hace la recepción exterior).
   */
  canCreateFinding(role?: string): boolean {
    const r = this.normalizeRole(role);
    return [
      'TECNICO', 'LUBRICADOR', 'JEFE_DE_PATIO',
      'GERENTE_COMERCIAL', 'ADMINISTRADOR', 'SUPER_ADMIN', 'ADMIN',
    ].includes(r);
  }

  /**
   * Puede GESTIONAR hallazgos (editar precio, estado de contacto, notas):
   * Solo Gerente Comercial y Administradores.
   */
  canManageFinding(role?: string): boolean {
    return this.isSuperAdmin(role);
  }
}
