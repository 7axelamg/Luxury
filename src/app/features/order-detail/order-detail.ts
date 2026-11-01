import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Sidebar } from '../../layout/sidebar/sidebar';
import { ChecklistItem } from '../../core/models/models';
import { OrderService, OrderDto, ActionHistoryDto } from '../../core/services/order';
import { RoleService } from '../../core/services/role.service';
import { NotificationService } from '../../core/services/notification.service';
import { cleanVehicleTitle } from '../../core/utils/vehicle-utils';

import { IconComponent } from '../../shared/ui/icon/icon.component';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, Sidebar, FormsModule, IconComponent],
  templateUrl: './order-detail.html',
  styleUrl: './order-detail.css'
})
export class OrderDetail implements OnInit {
  orderId: string = '';
  activeTab: string = 'resumen';
  currentUser: any;

  order: OrderDto | null = null;
  history: ActionHistoryDto[] = [];
  historyLoading = false;
  isLoading = true;
  errorMessage = '';
  isAdvancing = false;
  showAdminStepSelector = false;

  get pasos() { return this.roleService.PASOS; }

  // ─── Cierre y Firma de Actas ─────────────────────────────────────────────
  actaCierre = {
    pertenenciasDevueltas: true,
    inspeccionLimpiezaConforme: true,
    liquidacionPagada: true,
    documentosCompletos: true,
    firmaGerente: '',
    observacionesFinales: 'Vehículo revisado en conformidad. Servicios ejecutados a satisfacción del cliente.',
    fechaFirma: ''
  };

  // ─── Checklist de 9 Ítems (Sistema Sobrio, Sin Emojis) ────────────────────
  vehicleChecklist: {
    id: string;
    item: string;
    icono: string;
    estado: 'BIEN' | 'PROXIMO' | 'COTIZAR';
    kmProximo: number | null;
    observacion: string;
    servicioId?: string | null;
  }[] = [
    { id: 'c1', item: 'Aceite de Motor', icono: 'droplet', estado: 'BIEN', kmProximo: 2000, observacion: '', servicioId: 's1' },
    { id: 'c2', item: 'Líquido Refrigerante', icono: 'thermometer', estado: 'BIEN', kmProximo: 5000, observacion: '', servicioId: 's_refrig' },
    { id: 'c3', item: 'Líquido de Transmisión', icono: 'refresh-cw', estado: 'BIEN', kmProximo: 5000, observacion: '', servicioId: 's3' },
    { id: 'c4', item: 'Líquido de Frenos', icono: 'disc', estado: 'BIEN', kmProximo: 5000, observacion: '', servicioId: 's7' },
    { id: 'c5', item: 'Filtros de Aire', icono: 'wind', estado: 'BIEN', kmProximo: 2000, observacion: '', servicioId: 's4' },
    { id: 'c6', item: 'Pastillas', icono: 'disc', estado: 'BIEN', kmProximo: 3000, observacion: '', servicioId: 's8' },
    { id: 'c7', item: 'Llantas', icono: 'circle', estado: 'BIEN', kmProximo: 5000, observacion: '', servicioId: 's16' },
    { id: 'c8', item: 'Plumillas', icono: 'wiper', estado: 'BIEN', kmProximo: 2000, observacion: '', servicioId: 's14' },
    { id: 'c9', item: 'Extintor', icono: 'flame', estado: 'BIEN', kmProximo: null, observacion: '', servicioId: 's15' }
  ];

  setChecklistState(item: any, state: 'BIEN' | 'PROXIMO' | 'COTIZAR') {
    item.estado = state;
    if (state === 'COTIZAR' && item.servicioId) {
      const match = this.servicesCotizacionList.find(s => s.id === item.servicioId);
      if (match) match.seleccionado = true;
    }
    this.saveDraft();
  }

  setKmProximo(item: any, offsetKm: number) {
    item.kmProximo = offsetKm;
    item.estado = 'PROXIMO';
    this.saveDraft();
  }

  getEstimadoKm(offset: number | null | undefined): number {
    const base = Number(this.order?.kilometraje) || 0;
    return base + (Number(offset) || 0);
  }

  marcarTodosChecklist(state: 'BIEN' | 'PROXIMO' | 'COTIZAR') {
    this.vehicleChecklist.forEach(i => i.estado = state);
    if (state === 'COTIZAR') {
      this.vehicleChecklist.forEach(i => {
        if (i.servicioId) {
          const match = this.servicesCotizacionList.find(s => s.id === i.servicioId);
          if (match) match.seleccionado = true;
        }
      });
    }
    this.saveDraft();
  }

  sincronizarHallazgosConCotizacion() {
    this.vehicleChecklist.forEach(i => {
      if ((i.estado === 'COTIZAR' || (i as any).estado === 'CAMBIO_YA' || (i as any).estado === 'M/NO') && i.servicioId) {
        const match = this.servicesCotizacionList.find(s => s.id === i.servicioId);
        if (match) match.seleccionado = true;
      }
    });
    this.saveDraft();
    this.setTab('cotizacion');
  }

  getServicioNombre(servicioId?: string | null): string {
    if (!servicioId) return '';
    const s = this.servicesCotizacionList.find(item => item.id === servicioId);
    return s ? `${s.nombre} ($${s.precio.toLocaleString()} COP)` : '';
  }

  get checklistSummary() {
    const total = this.vehicleChecklist.length;
    const bien = this.vehicleChecklist.filter(i => i.estado === 'BIEN' || (i as any).estado === 'OPTIMO' || (i as any).estado === 'B/SI').length;
    const proximos = this.vehicleChecklist.filter(i => i.estado === 'PROXIMO').length;
    const cotizar = this.vehicleChecklist.filter(i => i.estado === 'COTIZAR' || (i as any).estado === 'CAMBIO_YA' || (i as any).estado === 'M/NO').length;
    return {
      total,
      bien,
      proximos,
      cotizar,
      buenos: bien,
      malos: cotizar,
      optimos: bien,
      cambioYa: cotizar,
      na: 0
    };
  }

  // ─── Modal / Bottom Sheet de Confirmación Checklist ──────────────────────
  showChecklistConfirmation: boolean = false;
  deseaNotificar: boolean = false;
  motivoContinuar: string = '';

  get itemsBien() {
    return this.vehicleChecklist.filter(
      (i) => i.estado === 'BIEN' || (i as any).estado === 'OPTIMO' || (i as any).estado === 'B/SI',
    );
  }

  get itemsProximo() {
    return this.vehicleChecklist.filter((i) => i.estado === 'PROXIMO');
  }

  get itemsCotizar() {
    return this.vehicleChecklist.filter(
      (i) => i.estado === 'COTIZAR' || (i as any).estado === 'CAMBIO_YA' || (i as any).estado === 'M/NO',
    );
  }

  abrirConfirmacionChecklist() {
    this.deseaNotificar = false;
    this.motivoContinuar = '';
    this.showChecklistConfirmation = true;
    this.cdr.markForCheck();
  }

  cerrarConfirmacionChecklist() {
    this.showChecklistConfirmation = false;
    this.cdr.markForCheck();
  }

  confirmarYContinuarChecklist() {
    if (this.isAdvancing) return;
    this.isAdvancing = true;

    // Sincronizar hallazgos con cotización antes de avanzar
    this.vehicleChecklist.forEach((i) => {
      if (
        (i.estado === 'COTIZAR' || (i as any).estado === 'CAMBIO_YA' || (i as any).estado === 'M/NO') &&
        i.servicioId
      ) {
        const match = this.servicesCotizacionList.find((s) => s.id === i.servicioId);
        if (match) match.seleccionado = true;
      }
    });
    this.saveDraft();

    const notificar = this.deseaNotificar;
    const motivo = this.motivoContinuar.trim();
    const cotizarCount = this.itemsCotizar.length;

    this.orderService
      .advanceStep(this.orderId, {
        notificar,
        motivo: motivo || undefined,
        itemsPorCotizar: cotizarCount,
        hayItemsPorCotizar: cotizarCount > 0,
      })
      .subscribe({
        next: (updatedOrder) => {
          this.order = updatedOrder;
          this.isAdvancing = false;
          this.showChecklistConfirmation = false;
          this.loadHistory();
          if (notificar) {
            this.notificationService.refresh(this.currentUser?.role);
          }
          this.setTab('cotizacion');
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isAdvancing = false;
          this.cdr.markForCheck();
          const msg =
            err?.error?.message ||
            'Error al avanzar la orden. Verifique los permisos o la conexión con el servidor.';
          alert(msg);
        },
      });
  }

  // ─── Local Draft Storage ──────────────────────────────────────────────────
  carouselIndex: number = 0;

  saveDraft() {
    if (!this.orderId) return;
    try {
      const draft = {
        checklist: this.vehicleChecklist,
        cotizacionServices: this.servicesCotizacionList,
        incluirIva: this.incluirIva,
        descuento: this.descuentoFactura,
        timestamp: Date.now()
      };
      localStorage.setItem(`luxury_order_draft_${this.orderId}`, JSON.stringify(draft));
    } catch (e) {}
  }

  loadDraft() {
    if (!this.orderId) return;
    try {
      const raw = localStorage.getItem(`luxury_order_draft_${this.orderId}`);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft.checklist && Array.isArray(draft.checklist)) {
          draft.checklist.forEach((oldItem: any) => {
            const current = this.vehicleChecklist.find(c => c.id === oldItem.id || c.item.toLowerCase() === (oldItem.item || '').toLowerCase());
            if (current) {
              if (oldItem.estado === 'B/SI' || oldItem.estado === 'OPTIMO' || oldItem.estado === 'BIEN') current.estado = 'BIEN';
              else if (oldItem.estado === 'M/NO' || oldItem.estado === 'CAMBIO_YA' || oldItem.estado === 'COTIZAR') current.estado = 'COTIZAR';
              else if (oldItem.estado === 'PROXIMO') current.estado = 'PROXIMO';
              else current.estado = 'BIEN';
              if (oldItem.kmProximo !== undefined) current.kmProximo = oldItem.kmProximo;
              current.observacion = oldItem.observacion || '';
            }
          });
        }
        if (draft.cotizacionServices && Array.isArray(draft.cotizacionServices)) {
          this.servicesCotizacionList = draft.cotizacionServices;
        }
        if (draft.incluirIva !== undefined) this.incluirIva = draft.incluirIva;
        if (draft.descuento !== undefined) this.descuentoFactura = draft.descuento;
      }
    } catch (e) {}
  }

  // ─── Cotización Checklist & Facturación Instantánea (Paso 2) ──────────────
  selectedCotizacionCategory: string = 'TODOS';
  cotizacionSearch: string = '';
  incluirIva: boolean = true;
  descuentoFactura: number = 0;
  formaPagoFactura: string = 'Contado / Transferencia Nequi-Bancolombia';
  showAddCustomServiceForm: boolean = false;
  nuevoCustomService = { nombre: '', categoria: 'ADICIONALES', precio: null as number | null, cantidad: 1 };
  selectedPhoto: string | null = null;
  showPrintModal: boolean = false;

  servicesCotizacionList: {
    id: string;
    categoria: string;
    nombre: string;
    precio: number;
    cantidad: number;
    seleccionado: boolean;
  }[] = [
    // 1. LUBRICACIÓN Y ACEITES
    { id: 's1', categoria: 'LUBRICACIÓN Y ACEITES', nombre: 'Cambio de Aceite 100% Sintético (Motul 5W30)', precio: 380000, cantidad: 1, seleccionado: true },
    { id: 's2', categoria: 'LUBRICACIÓN Y ACEITES', nombre: 'Filtro de Aceite de Alto Rendimiento', precio: 95000, cantidad: 1, seleccionado: true },
    { id: 's_refrig', categoria: 'LUBRICACIÓN Y ACEITES', nombre: 'Líquido Refrigerante Larga Duración (Galón 50/50)', precio: 120000, cantidad: 1, seleccionado: false },
    { id: 's3', categoria: 'LUBRICACIÓN Y ACEITES', nombre: 'Servicio de Fluido Transmisión / Caja', precio: 280000, cantidad: 1, seleccionado: false },

    // 2. FILTROS Y AIRE
    { id: 's4', categoria: 'FILTROS Y AIRE', nombre: 'Filtro de Aire de Motor OEM', precio: 140000, cantidad: 1, seleccionado: true },
    { id: 's5', categoria: 'FILTROS Y AIRE', nombre: 'Filtro de Aire Acondicionado Habitáculo', precio: 110000, cantidad: 1, seleccionado: true },
    { id: 's6', categoria: 'FILTROS Y AIRE', nombre: 'Filtro de Combustible', precio: 130000, cantidad: 1, seleccionado: false },

    // 3. SISTEMA DE FRENOS
    { id: 's7', categoria: 'SISTEMA DE FRENOS', nombre: 'Líquido de Frenos Brembo DOT 5.1', precio: 160000, cantidad: 1, seleccionado: false },
    { id: 's8', categoria: 'SISTEMA DE FRENOS', nombre: 'Pastillas de Frenos Cerámicas (Eje Delantero)', precio: 450000, cantidad: 1, seleccionado: false },
    { id: 's9', categoria: 'SISTEMA DE FRENOS', nombre: 'Pastillas de Frenos Cerámicas (Eje Trasero)', precio: 380000, cantidad: 1, seleccionado: false },

    // 4. ESTÉTICA Y DETALLADO
    { id: 's10', categoria: 'ESTÉTICA Y DETALLADO', nombre: 'Tratamiento Nanocerámico Carrocería', precio: 850000, cantidad: 1, seleccionado: false },
    { id: 's11', categoria: 'ESTÉTICA Y DETALLADO', nombre: 'Polichado y Corrección de Pintura 3 Pasos', precio: 420000, cantidad: 1, seleccionado: false },
    { id: 's12', categoria: 'ESTÉTICA Y DETALLADO', nombre: 'Lavado de Motor a Vapor e Hidroblasting', precio: 180000, cantidad: 1, seleccionado: false },
    { id: 's13', categoria: 'ESTÉTICA Y DETALLADO', nombre: 'Detallado e Higienización Interior Ozono', precio: 250000, cantidad: 1, seleccionado: false },

    // 5. ACCESORIOS Y ADICIONALES
    { id: 's14', categoria: 'ACCESORIOS Y ADICIONALES', nombre: 'Plumillas Limpiaparabrisas Bosch Aerotwin (Par)', precio: 120000, cantidad: 1, seleccionado: false },
    { id: 's15', categoria: 'ACCESORIOS Y ADICIONALES', nombre: 'Recarga Extintor Solkaflam 3.75 lbs', precio: 65000, cantidad: 1, seleccionado: false },
    { id: 's16', categoria: 'ACCESORIOS Y ADICIONALES', nombre: 'Alineación Computarizada 3D y Balanceo', precio: 150000, cantidad: 1, seleccionado: false }
  ];

  get cotizacionCategories(): string[] {
    const cats: string[] = [];
    this.servicesCotizacionList.forEach(s => {
      if (!cats.includes(s.categoria)) cats.push(s.categoria);
    });
    return cats;
  }

  get selectedCotizacionItems() {
    return this.servicesCotizacionList.filter(s => s.seleccionado);
  }

  get filteredCotizacionServices() {
    return this.servicesCotizacionList.filter(s => {
      const matchCat = this.selectedCotizacionCategory === 'TODOS' || s.categoria === this.selectedCotizacionCategory;
      const matchQuery = !this.cotizacionSearch.trim() || s.nombre.toLowerCase().includes(this.cotizacionSearch.toLowerCase());
      return matchCat && matchQuery;
    });
  }

  get subtotalFactura(): number {
    return this.selectedCotizacionItems.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
  }

  get ivaFactura(): number {
    return this.incluirIva ? Math.round(this.subtotalFactura * 0.19) : 0;
  }

  get totalFactura(): number {
    const total = this.subtotalFactura + this.ivaFactura - (this.descuentoFactura || 0);
    return Math.max(0, total);
  }

  toggleCotizacionItem(item: any) {
    item.seleccionado = !item.seleccionado;
    this.saveDraft();
  }

  marcarTodosCotizacion(estado: boolean) {
    this.servicesCotizacionList.forEach(s => s.seleccionado = estado);
    this.saveDraft();
  }

  agregarServicioPersonalizado() {
    if (!this.nuevoCustomService.nombre || !this.nuevoCustomService.precio) return;
    const newId = 'custom-' + Date.now();
    this.servicesCotizacionList.unshift({
      id: newId,
      categoria: this.nuevoCustomService.categoria,
      nombre: this.nuevoCustomService.nombre,
      precio: Number(this.nuevoCustomService.precio),
      cantidad: Number(this.nuevoCustomService.cantidad || 1),
      seleccionado: true
    });
    this.nuevoCustomService = { nombre: '', categoria: 'ADICIONALES', precio: null, cantidad: 1 };
    this.showAddCustomServiceForm = false;
    this.saveDraft();
  }

  imprimirFactura() {
    window.print();
  }

  cleanTitle(vehiculo: string | null | undefined, placa?: string | null): string {
    return cleanVehicleTitle(vehiculo, placa);
  }

  descargarFacturaPDF() {
    window.print();
  }

  enviarFacturaWhatsApp() {
    if (!this.order) return;
    const vehiculoLimpio = this.cleanTitle(this.order.vehiculo, this.order.placa);
    const msg = `Hola *${this.order.cliente}*, le compartimos su Factura de Servicio en *Luxury Service Car Home* para su vehículo *${vehiculoLimpio}* (Placa: ${this.order.placa}):\n\n` +
      `*Factura:* #FAC-${this.order.id}\n` +
      `*Subtotal:* $${this.subtotalFactura.toLocaleString()} COP\n` +
      `*IVA (19%):* $${this.ivaFactura.toLocaleString()} COP\n` +
      `*TOTAL:* $${this.totalFactura.toLocaleString()} COP\n` +
      `*Forma de Pago:* ${this.formaPagoFactura}\n\n` +
      `¡Muchas gracias por su confianza!`;
    const phoneClean = (this.order.telefono || '').replace(/\D/g, '');
    const url = `https://wa.me/${phoneClean}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  }

  // ─── Constructor ─────────────────────────────────────────────────────────
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    public roleService: RoleService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  // ─── Init ─────────────────────────────────────────────────────────────────
  ngOnInit() {
    this.orderId = this.route.snapshot.paramMap.get('id') || '';
    const userStr = localStorage.getItem('user');
    this.currentUser = userStr ? JSON.parse(userStr) : { role: 'SUPER_ADMIN', username: 'Admin' };
    this.loadOrder();
  }

  loadOrder() {
    this.isLoading = true;
    this.errorMessage = '';
    this.orderService.getOne(this.orderId).subscribe({
      next: (data) => {
        this.order = data;
        this.isLoading = false;
        this.loadDraft();
        this.setTabForCurrentStep();
        this.loadHistory();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorMessage = err.status === 404
          ? `Orden ${this.orderId} no encontrada.`
          : 'Error al cargar la orden. Verifique la conexión con el servidor.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ─── Trazabilidad de Responsables / Historial ──────────────
  loadHistory() {
    this.historyLoading = true;
    this.orderService.getHistory(this.orderId).subscribe({
      next: (items) => {
        this.history = items;
        this.historyLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.historyLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ─── Permisos ─────────────────────────────────────────────────────────────
  isSuperAdmin(): boolean {
    return this.roleService.isSuperAdmin(this.currentUser?.role);
  }

  isSuperAdminOrJefe(): boolean {
    return (
      this.roleService.isSuperAdmin(this.currentUser?.role) ||
      this.roleService.normalizeRole(this.currentUser?.role) === 'JEFE_DE_PATIO'
    );
  }

  canCreateFinding(): boolean {
    return this.roleService.canCreateFinding(this.currentUser?.role);
  }

  canManageFinding(): boolean {
    return this.roleService.canManageFinding(this.currentUser?.role);
  }

  puedeGestionarPaso(pasoId: number): boolean {
    if (!this.order || this.order.pasoActual !== pasoId) return false;
    return this.roleService.canAdvanceStep(pasoId, this.currentUser?.role);
  }

  getResponsablePaso(pasoId: number): string {
    return this.pasos.find(p => p.id === pasoId)?.responsable || 'Personal designado';
  }

  isCurrentStepForMe(): boolean {
    if (!this.order) return false;
    return this.puedeGestionarPaso(this.order.pasoActual);
  }

  canSignActas(): boolean {
    const r = this.roleService.normalizeRole(this.currentUser?.role);
    return r === 'GERENTE_COMERCIAL' || r === 'ADMINISTRADOR' || r === 'SUPER_ADMIN' || r === 'ADMIN';
  }

  // ─── Navegación y flujo ───────────────────────────────────────────────────
  setTabForCurrentStep() {
    if (!this.order) return;
    if (this.order.pasoActual === 1) this.activeTab = 'checklist';
    else if (this.order.pasoActual >= 2) this.activeTab = 'cotizacion';
    else this.activeTab = 'resumen';
  }

  setTab(tab: string) { this.activeTab = tab; }

  toggleAdminStepSelector() { this.showAdminStepSelector = !this.showAdminStepSelector; }

  saltarAPaso(pasoId: number) {
    if (!this.order || this.isAdvancing || !this.isSuperAdminOrJefe()) return;
    this.isAdvancing = true;
    this.orderService.setStep(this.orderId, pasoId).subscribe({
      next: (updatedOrder) => {
        this.order = updatedOrder;
        this.isAdvancing = false;
        this.loadHistory();
        if (pasoId === 1) this.activeTab = 'checklist';
        else if (pasoId === 2) this.activeTab = 'cotizacion';
        else if (pasoId >= 3) { alert('¡Orden marcada como Entregada y Cerrada!'); this.router.navigate(['/dashboard']); return; }
        this.cdr.markForCheck();
      },
      error: () => {
        this.isAdvancing = false;
        this.cdr.markForCheck();
        alert('Error al saltar de paso.');
      }
    });
  }

  avanzarPaso() {
    if (!this.order || this.isAdvancing) return;
    this.isAdvancing = true;
    this.orderService.advanceStep(this.orderId).subscribe({
      next: (updatedOrder) => {
        this.order = updatedOrder;
        this.isAdvancing = false;
        this.loadHistory();
        if (updatedOrder.pasoActual >= 3) {
          alert('¡Factura emitida y orden cerrada exitosamente!');
          this.router.navigate(['/dashboard']);
          return;
        }
        this.setTabForCurrentStep();
        this.cdr.markForCheck();
      },
      error: () => {
        this.isAdvancing = false;
        this.cdr.markForCheck();
        alert('Error al avanzar el paso. Verifique la conexión con el servidor.');
      }
    });
  }

  // ─── Helpers de Trazabilidad ──────────────────────────────
  getAsignadoActual(): string {
    if (!this.order) return '';
    const paso = this.order.pasoActual;
    switch (paso) {
      case 1:
        return this.order.recepcionista || 'Alejandro Gómez (Recepción)';
      case 2:
        return this.order.responsableEtapa2 || 'Roberto Gómez (Gerente Comercial)';
      default:
        return 'Servicio Finalizado y Entregado';
    }
  }

  getHistoryActionIcon(accion: string): string {
    if (!accion) return 'circle';
    if (accion.includes('Ingresó')) return 'inbox';
    if (accion.includes('Checklist') || accion.includes('Recepción')) return 'clipboard';
    if (accion.includes('Factura') || accion.includes('Cotización')) return 'file-text';
    if (accion.includes('Entrega') || accion.includes('Cerró')) return 'check';
    return 'circle';
  }

  getEtapaLabel(etapa: number): string {
    switch (etapa) {
      case 1: return 'Paso 1 · Checklist Ingreso';
      case 2: return 'Paso 2 · Cotización & Factura';
      default: return `Paso ${etapa}`;
    }
  }

  getEtapaBadgeClass(etapa: number): string {
    switch (etapa) {
      case 1: return 'badge-e1';
      case 2: return 'badge-e2';
      default: return 'badge-egeneric';
    }
  }
}
