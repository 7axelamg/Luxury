import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { EmployeesService, Employee, RoleAuditEntry } from '../../core/services/employees.service';
import { AuthService } from '../../core/services/auth';
import { RoleService } from '../../core/services/role.service';
import { Sidebar } from '../../layout/sidebar/sidebar';

import { IconComponent } from '../../shared/ui/icon/icon.component';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, Sidebar, IconComponent],
  templateUrl: './employees.component.html',
  styleUrls: ['./employees.component.css']
})
export class EmployeesComponent implements OnInit {
  private employeesService = inject(EmployeesService);
  public authService = inject(AuthService);
  public roleService = inject(RoleService);

  // Estados reactivos
  employees = signal<Employee[]>([]);
  auditLogs = signal<RoleAuditEntry[]>([]);
  isLoading = signal<boolean>(false);
  activeTab = signal<'list' | 'audit'>('list');
  searchTerm = signal<string>('');
  roleFilter = signal<string>('TODOS');

  // Modal de Empleado (Crear / Editar)
  showEmployeeModal = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  employeeForm: {
    id?: string;
    nombre: string;
    documento: string;
    email: string;
    telefono: string;
    cargo: string;
    username: string;
    password?: string;
    role: string;
    activo: boolean;
    motivo_cambio_rol?: string;
  } = this.getEmptyForm();

  // Modal de Cambio Rápido de Rol
  showRoleModal = signal<boolean>(false);
  selectedEmployeeForRole = signal<Employee | null>(null);
  newRoleSelection = signal<string>('');
  roleChangeReason = signal<string>('');

  // Notificación Toast
  toastMessage = signal<string | null>(null);
  toastType = signal<'success' | 'error'>('success');

  // Roles disponibles
  readonly ROLES_LIST = [
    { value: 'SUPER_ADMIN', label: 'Super Administrador', badge: 'badge-purple', desc: 'Acceso y control total del sistema' },
    { value: 'GERENTE_COMERCIAL', label: 'Gerente Comercial', badge: 'badge-blue', desc: 'Cotización, facturación y gestión de equipo' },
    { value: 'JEFE_DE_PATIO', label: 'Jefe de Patio', badge: 'badge-amber', desc: 'Inspección técnica y recepción inicial' },
    { value: 'RECEPCIONISTA', label: 'Recepcionista', badge: 'badge-cyan', desc: 'Ingreso de vehículos y atención inicial' },
    { value: 'TECNICO', label: 'Técnico Especialista', badge: 'badge-emerald', desc: 'Diagnóstico técnico automotriz' },
    { value: 'LUBRICADOR', label: 'Lubricador', badge: 'badge-orange', desc: 'Servicios de fluidos y mantenimiento rápido' }
  ];

  filteredEmployees = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const role = this.roleFilter();

    return this.employees().filter(emp => {
      const matchTerm =
        !term ||
        emp.nombre.toLowerCase().includes(term) ||
        (emp.documento && emp.documento.includes(term)) ||
        emp.username.toLowerCase().includes(term) ||
        (emp.cargo && emp.cargo.toLowerCase().includes(term));

      const matchRole = role === 'TODOS' || emp.role === role;

      return matchTerm && matchRole;
    });
  });

  get canManageRoles(): boolean {
    const user = this.authService.getCurrentUser();
    const r = this.roleService.normalizeRole(user?.role);
    return r === 'SUPER_ADMIN' || r === 'GERENTE_COMERCIAL' || r === 'ADMINISTRADOR';
  }

  ngOnInit(): void {
    this.loadEmployees();
    if (this.canManageRoles) {
      this.loadAuditLogs();
    }
  }

  loadEmployees(): void {
    this.isLoading.set(true);
    this.employeesService.getEmployees().subscribe({
      next: (data) => {
        this.employees.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.showToast('Error al cargar empleados: ' + (err.error?.message || err.message), 'error');
        this.isLoading.set(false);
      }
    });
  }

  loadAuditLogs(): void {
    this.employeesService.getAuditLogs().subscribe({
      next: (logs) => this.auditLogs.set(logs),
      error: () => {}
    });
  }

  openCreateModal(): void {
    this.isEditing.set(false);
    this.employeeForm = this.getEmptyForm();
    this.showEmployeeModal.set(true);
  }

  openEditModal(emp: Employee): void {
    this.isEditing.set(true);
    this.employeeForm = {
      id: emp.id,
      nombre: emp.nombre,
      documento: emp.documento || '',
      email: emp.email || '',
      telefono: emp.telefono || '',
      cargo: emp.cargo || '',
      username: emp.username,
      password: '',
      role: emp.role,
      activo: emp.activo,
      motivo_cambio_rol: ''
    };
    this.showEmployeeModal.set(true);
  }

  closeModal(): void {
    this.showEmployeeModal.set(false);
    this.showRoleModal.set(false);
  }

  saveEmployee(): void {
    const nombre = (this.employeeForm.nombre || '').trim();
    const rawUsername = (this.employeeForm.username || '').trim().toLowerCase();

    if (!nombre) {
      this.showToast('El nombre completo es obligatorio', 'error');
      return;
    }

    if (!rawUsername) {
      this.showToast('El nombre de usuario es obligatorio', 'error');
      return;
    }

    const usernameRegex = /^[a-z0-9._-]{3,30}$/;
    if (!usernameRegex.test(rawUsername)) {
      this.showToast('El usuario debe tener entre 3 y 30 caracteres (minúsculas, números, puntos o guiones, sin espacios)', 'error');
      return;
    }

    this.employeeForm.nombre = nombre;
    this.employeeForm.username = rawUsername;

    if (this.isEditing() && this.employeeForm.id) {
      this.employeesService.updateEmployee(this.employeeForm.id, this.employeeForm).subscribe({
        next: () => {
          this.showToast('Empleado actualizado con éxito', 'success');
          this.closeModal();
          this.loadEmployees();
          this.loadAuditLogs();
        },
        error: (err) => this.showToast('Error: ' + (err.error?.message || err.message), 'error')
      });
    } else {
      this.employeesService.createEmployee(this.employeeForm).subscribe({
        next: () => {
          this.showToast('Empleado registrado correctamente', 'success');
          this.closeModal();
          this.loadEmployees();
          this.loadAuditLogs();
        },
        error: (err) => this.showToast('Error al registrar: ' + (err.error?.message || err.message), 'error')
      });
    }
  }

  openChangeRoleModal(emp: Employee): void {
    this.selectedEmployeeForRole.set(emp);
    this.newRoleSelection.set(emp.role);
    this.roleChangeReason.set('');
    this.showRoleModal.set(true);
  }

  confirmRoleChange(): void {
    const emp = this.selectedEmployeeForRole();
    const newRole = this.newRoleSelection();
    if (!emp || !newRole) return;

    if (emp.role === newRole) {
      this.closeModal();
      return;
    }

    this.employeesService.updateEmployee(emp.id, {
      role: newRole,
      motivo_cambio_rol: this.roleChangeReason() || 'Reasignación operativa de cargo'
    }).subscribe({
      next: () => {
        this.showToast(`Rol de ${emp.nombre} actualizado a ${this.getRoleName(newRole)}`, 'success');
        this.closeModal();
        this.loadEmployees();
        this.loadAuditLogs();
      },
      error: (err) => this.showToast('Error al cambiar rol: ' + (err.error?.message || err.message), 'error')
    });
  }

  toggleActiveStatus(emp: Employee): void {
    const action = emp.activo
      ? this.employeesService.deactivateEmployee(emp.id)
      : this.employeesService.activateEmployee(emp.id);

    action.subscribe({
      next: () => {
        this.showToast(`Estado de ${emp.nombre} actualizado`, 'success');
        this.loadEmployees();
      },
      error: (err) => this.showToast('Error al cambiar estado: ' + (err.error?.message || err.message), 'error')
    });
  }

  getRoleBadge(role: string): string {
    const r = this.ROLES_LIST.find(item => item.value === role);
    return r ? r.badge : 'badge-neutral';
  }

  getRoleName(role: string): string {
    const r = this.ROLES_LIST.find(item => item.value === role);
    return r ? r.label : role;
  }

  private getEmptyForm() {
    return {
      nombre: '',
      documento: '',
      email: '',
      telefono: '',
      cargo: '',
      username: '',
      password: '',
      role: 'RECEPCIONISTA',
      activo: true,
      motivo_cambio_rol: ''
    };
  }

  private showToast(msg: string, type: 'success' | 'error' = 'success'): void {
    this.toastMessage.set(msg);
    this.toastType.set(type);
    setTimeout(() => this.toastMessage.set(null), 4000);
  }
}
