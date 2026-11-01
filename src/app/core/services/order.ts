import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ActionHistoryDto {
  id: string;
  orderId: string;
  userId: string | null;
  nombreUsuario: string;
  username: string;
  rolUsuario: string;
  etapa: number;
  accion: string;
  detalle: string | null;
  fecha: string;
}

export interface OrderDto {
  id: string;
  cliente: string;
  documento?: string;
  telefono?: string;
  vehiculo: string;
  placa?: string;
  estado: string;
  pasoActual: number;
  kilometraje: number;
  observaciones: string;
  pertenencias: string;
  fechaIngreso: string;
  fechaCierre?: string | null;
  fotos?: string[];
  cotizacionDoc?: {
    nombre: string;
    url: string;
    fecha: string;
    tamano?: string;
  };
  clienteNotificado?: boolean;
  canalNotificacion?: string;
  decisionCliente?: string;
  pagoAcordado?: number;
  notasCliente?: string;

  // Responsables directos por etapa (CAMBIO 2)
  recepcionista?: string | null;
  recepcionistaId?: string | null;
  responsableEtapa1?: string | null;
  responsableEtapa1Id?: string | null;
  fechaEtapa1?: string | null;
  responsableEtapa2?: string | null;
  responsableEtapa2Id?: string | null;
  fechaEtapa2?: string | null;
  responsableEtapa3?: string | null;
  responsableEtapa3Id?: string | null;
  fechaEtapa3?: string | null;
  responsableEtapa4?: string | null;
  responsableEtapa4Id?: string | null;
  fechaEtapa4?: string | null;
  responsableEtapa5?: string | null;
  responsableEtapa5Id?: string | null;
  fechaEtapa5?: string | null;
}

export interface CreateOrderDto {
  placa: string;
  vehiculo?: string;
  nombreCliente?: string;
  telefono?: string;
  documento?: string;
  marca?: string;
  modelo?: string;
  color?: string;
  kilometraje?: number;
  nivelCombustible?: string;
  pertenencias?: string;
  observaciones?: string;
  fotos?: string[];
  cotizacionDoc?: {
    nombre: string;
    url: string;
    fecha: string;
    tamano?: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly apiUrl = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<OrderDto[]> {
    return this.http.get<OrderDto[]>(this.apiUrl);
  }

  getOne(id: string): Observable<OrderDto> {
    return this.http.get<OrderDto>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateOrderDto): Observable<OrderDto> {
    return this.http.post<OrderDto>(this.apiUrl, dto);
  }

  advanceStep(
    id: string,
    data?: { notificar?: boolean; motivo?: string; itemsPorCotizar?: number; hayItemsPorCotizar?: boolean },
  ): Observable<OrderDto> {
    return this.http.put<OrderDto>(`${this.apiUrl}/${id}/advance`, data || {});
  }

  setStep(id: string, step: number): Observable<OrderDto> {
    return this.http.put<OrderDto>(`${this.apiUrl}/${id}/set-step`, { step });
  }

  /** GET /orders/:id/history — Historial de acciones con trazabilidad de usuario */
  getHistory(id: string): Observable<ActionHistoryDto[]> {
    return this.http.get<ActionHistoryDto[]>(`${this.apiUrl}/${id}/history`);
  }

  /** POST /orders/:id/history — Registra una acción (ej: marcar ítem en etapa 3) */
  logAction(
    id: string,
    action: { etapa: number; accion: string; detalle?: string },
  ): Observable<ActionHistoryDto> {
    return this.http.post<ActionHistoryDto>(`${this.apiUrl}/${id}/history`, action);
  }
}
