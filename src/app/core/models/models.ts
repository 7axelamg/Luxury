export type Rol = 'Recepcionista' | 'Jefe de patio' | 'Técnico' | 'Gerente comercial' | 'Administrador';

export interface Usuario {
  id: string;
  nombre: string;
  rol: Rol;
}

export interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  documento: string;
}

export interface Vehiculo {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  color: string;
  kilometraje: number;
}

export type EstadoOrden = 
  | 'Recibido' 
  | 'Recepción en proceso' 
  | 'Recepción completada' 
  | 'Revisión 1 en proceso' 
  | 'Revisión 1 completada' 
  | 'Revisión 2 en proceso' 
  | 'Pendiente de autorización' 
  | 'Trabajos en proceso' 
  | 'Trabajos completados' 
  | 'Revisión final' 
  | 'Entregado' 
  | 'Cerrado';

export interface ChecklistItem {
  id: string;
  item: string;
  resultado: string;
  estadoSecundario?: string;
  referenciaMarca?: string;
  fechaProximoCambio?: string;
  fechaVencimiento?: string;
  observacion?: string;
  responsableId?: string;
}

export interface EvidenciaFotografica {
  id: string;
  url: string;
  etapa: string;
  fecha: Date;
  responsableId: string;
  descripcion?: string;
}

export interface Servicio {
  id: string;
  descripcion: string;
  costo: number;
  estado: 'Propuesto' | 'Autorizado' | 'Rechazado' | 'Realizado';
}

export interface Cotizacion {
  id: string;
  servicios: Servicio[];
  total: number;
  estado: 'Pendiente' | 'Aprobada' | 'Rechazada';
  fechaGeneracion: Date;
  evidenciasIds: string[];
}

export interface OrdenServicio {
  id: string;
  numero: string;
  cliente: Cliente;
  vehiculo: Vehiculo;
  estadoActual: EstadoOrden;
  fechaIngreso: Date;
  fechaSalida?: Date;
  
  pertenenciasCliente: string;
  nivelCombustible: string;
  observacionesRecepcion: string;
  
  fotografias: EvidenciaFotografica[];
  checklistRev1: ChecklistItem[];
  checklistRev2: ChecklistItem[];
  checklistEntrega: ChecklistItem[];
  
  cotizacion?: Cotizacion;
  
  responsableRecepcionId?: string;
  responsableRev1Id?: string;
  responsableRev2Id?: string;
  responsableVentaId?: string;
  responsableEntregaId?: string;
  
  historialEstados: { estado: EstadoOrden; fecha: Date; usuarioId: string }[];
}
