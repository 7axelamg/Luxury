import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Employee {
  id: string;
  username: string;
  nombre: string;
  documento?: string;
  email?: string;
  telefono?: string;
  cargo?: string;
  role: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RoleAuditEntry {
  id: string;
  target_user_id: string;
  target_username: string;
  target_nombre: string;
  previous_role: string;
  new_role: string;
  assigned_by_id: string;
  assigned_by_username: string;
  motivo?: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmployeesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/users`;

  getEmployees(): Observable<Employee[]> {
    return this.http.get<Employee[]>(this.apiUrl);
  }

  getEmployee(id: string): Observable<Employee> {
    return this.http.get<Employee>(`${this.apiUrl}/${id}`);
  }

  createEmployee(data: Partial<Employee> & { password?: string }): Observable<Employee> {
    return this.http.post<Employee>(this.apiUrl, data);
  }

  updateEmployee(id: string, data: Partial<Employee> & { motivo_cambio_rol?: string; password?: string }): Observable<Employee> {
    return this.http.patch<Employee>(`${this.apiUrl}/${id}`, data);
  }

  deactivateEmployee(id: string): Observable<Employee> {
    return this.http.patch<Employee>(`${this.apiUrl}/${id}/deactivate`, {});
  }

  activateEmployee(id: string): Observable<Employee> {
    return this.http.patch<Employee>(`${this.apiUrl}/${id}/activate`, {});
  }

  getAuditLogs(): Observable<RoleAuditEntry[]> {
    return this.http.get<RoleAuditEntry[]>(`${this.apiUrl}/audit-logs`);
  }
}
