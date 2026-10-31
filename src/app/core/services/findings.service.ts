import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface FindingDto {
  id: string;
  order_id: string;
  etapa_origen: number;          // 2 = Mecánica, 3 = Trabajos
  item_relacionado?: string;
  descripcion: string;
  foto_url?: string;
  estado: 'PENDIENTE' | 'COTIZADO' | 'AUTORIZADO' | 'RECHAZADO' | 'SIN_RESPUESTA';
  precio_cotizado?: number;
  fecha_contacto?: string;
  notas_contacto?: string;
  creado_por_id?: string;
  fecha_creacion: string;
}

export interface CreateFindingDto {
  etapa_origen: number;
  item_relacionado?: string;
  descripcion: string;
  foto_url?: string;
  creado_por_id?: string;
}

export interface UpdateFindingDto {
  estado?: FindingDto['estado'];
  precio_cotizado?: number;
  fecha_contacto?: string;
  notas_contacto?: string;
  descripcion?: string;
  foto_url?: string;
}

@Injectable({
  providedIn: 'root',
})
export class FindingsService {
  private readonly base = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  /** GET /orders/:orderId/findings */
  getByOrder(orderId: string): Observable<FindingDto[]> {
    return this.http.get<FindingDto[]>(`${this.base}/orders/${orderId}/findings`);
  }

  /** POST /orders/:orderId/findings */
  create(orderId: string, dto: CreateFindingDto): Observable<FindingDto> {
    return this.http.post<FindingDto>(`${this.base}/orders/${orderId}/findings`, dto);
  }

  /** PATCH /findings/:id */
  update(id: string, dto: UpdateFindingDto): Observable<FindingDto> {
    return this.http.patch<FindingDto>(`${this.base}/findings/${id}`, dto);
  }

  /** DELETE /findings/:id */
  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/findings/${id}`);
  }
}
