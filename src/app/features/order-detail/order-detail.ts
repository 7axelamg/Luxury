import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Sidebar } from '../../layout/sidebar/sidebar';
import { ChecklistItem } from '../../core/models/models';
import { OrderService, OrderDto, ActionHistoryDto } from '../../core/services/order';
import { RoleService } from '../../core/services/role.service';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, Sidebar, FormsModule],
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

  // ─── Checklist Oficial de Vehículos (6 Categorías - Imagen de Referencia) ──
  vehicleChecklist: { id: string; categoria: string; item: string; estado: 'B/SI' | 'M/NO' | 'N/A'; observacion: string }[] = [
    // 1. ACCESORIOS DE SEGURIDAD
    { id: 'c1', categoria: 'ACCESORIOS DE SEGURIDAD', item: 'EXTINTOR', estado: 'B/SI', observacion: '' },
    { id: 'c2', categoria: 'ACCESORIOS DE SEGURIDAD', item: 'BOTIQUIN', estado: 'B/SI', observacion: '' },
    { id: 'c3', categoria: 'ACCESORIOS DE SEGURIDAD', item: 'CONOS DE SEGURIDAD', estado: 'B/SI', observacion: '' },

    // 2. CORROSION
    { id: 'c4', categoria: 'CORROSION', item: 'PROTECCION ANTICORROSIVA', estado: 'B/SI', observacion: '' },
    { id: 'c5', categoria: 'CORROSION', item: 'LAVADO A VAPOR', estado: 'B/SI', observacion: '' },
    { id: 'c6', categoria: 'CORROSION', item: 'HIDROBLASTING', estado: 'B/SI', observacion: '' },

    // 3. ESTADO DE LLANTAS
    { id: 'c7', categoria: 'ESTADO DE LLANTAS', item: 'LLANTA DELANTERA IZQ.', estado: 'B/SI', observacion: '' },
    { id: 'c8', categoria: 'ESTADO DE LLANTAS', item: 'LLANTA DELANTERA DER.', estado: 'B/SI', observacion: '' },
    { id: 'c9', categoria: 'ESTADO DE LLANTAS', item: 'LLANTA TRASERA IZQ.', estado: 'B/SI', observacion: '' },
    { id: 'c10', categoria: 'ESTADO DE LLANTAS', item: 'LLANTA TRASERA DER.', estado: 'B/SI', observacion: '' },
    { id: 'c11', categoria: 'ESTADO DE LLANTAS', item: 'LLANTA DE REPUESTO', estado: 'B/SI', observacion: '' },

    // 4. ACEITES Y FILTROS
    { id: 'c12', categoria: 'ACEITES Y FILTROS', item: 'ACEITE', estado: 'B/SI', observacion: '' },
    { id: 'c13', categoria: 'ACEITES Y FILTROS', item: 'FILTRO DE COMBUSTION', estado: 'B/SI', observacion: '' },
    { id: 'c14', categoria: 'ACEITES Y FILTROS', item: 'FILTRO DE AIRE ACONDICIONADO', estado: 'B/SI', observacion: '' },
    { id: 'c15', categoria: 'ACEITES Y FILTROS', item: 'FILTRO DE ACEITE', estado: 'B/SI', observacion: '' },

    // 5. FRENOS
    { id: 'c16', categoria: 'FRENOS', item: 'NIVEL DE LIQUIDO DE FRENOS', estado: 'B/SI', observacion: '' },
    { id: 'c17', categoria: 'FRENOS', item: 'NIVEL DE REFRIGERANTE', estado: 'B/SI', observacion: '' },

    // 6. OTROS
    { id: 'c18', categoria: 'OTROS', item: 'CABLE DE INICIACION', estado: 'B/SI', observacion: '' },
    { id: 'c19', categoria: 'OTROS', item: 'PLUMILLAS DELANTERAS', estado: 'B/SI', observacion: '' },
    { id: 'c20', categoria: 'OTROS', item: 'PLUMILLAS TRASERAS', estado: 'B/SI', observacion: '' },
    { id: 'c21', categoria: 'OTROS', item: 'GATOS HIDRAULICOS', estado: 'B/SI', observacion: '' }
  ];

  get checklistCategories(): string[] {
    const cats: string[] = [];
    this.vehicleChecklist.forEach(i => {
      if (!cats.includes(i.categoria)) cats.push(i.categoria);
    });
    return cats;
  }

  getItemsByCategory(cat: string) {
    return this.vehicleChecklist.filter(i => i.categoria === cat);
  }

  setChecklistState(item: any, state: 'B/SI' | 'M/NO' | 'N/A') {
    item.estado = state;
  }

  marcarTodosChecklist(state: 'B/SI' | 'M/NO' | 'N/A') {
    this.vehicleChecklist.forEach(i => i.estado = state);
    this.saveDraft();
  }

  marcarCategoria(categoria: string, state: 'B/SI' | 'M/NO' | 'N/A') {
    this.vehicleChecklist.forEach(i => {
      if (i.categoria === categoria) i.estado = state;
    });
    this.saveDraft();
  }

  get checklistSummary() {
    const total = this.vehicleChecklist.length;
    const buenos = this.vehicleChecklist.filter(i => i.estado === 'B/SI').length;
    const malos = this.vehicleChecklist.filter(i => i.estado === 'M/NO').length;
    const na = this.vehicleChecklist.filter(i => i.estado === 'N/A').length;
    return { total, buenos, malos, na };
  }

  // ─── Mobile Carousel State para Checklist (Paso 1) ───────────────────────
  carouselIndex: number = 0;
  carouselAnimationDirection: 'next' | 'prev' = 'next';
  touchStartX: number = 0;
  touchEndX: number = 0;

  get currentCategory(): string {
    return this.checklistCategories[this.carouselIndex] || '';
  }

  get isCarouselSummary(): boolean {
    return this.carouselIndex >= this.checklistCategories.length;
  }

  get carouselProgressPercent(): number {
    const total = this.checklistCategories.length;
    if (this.carouselIndex >= total) return 100;
    return Math.round(((this.carouselIndex + 1) / (total + 1)) * 100);
  }

  nextCarouselStep() {
    if (this.carouselIndex <= this.checklistCategories.length) {
      this.carouselAnimationDirection = 'next';
      this.carouselIndex++;
      this.saveDraft();
    }
  }

  prevCarouselStep() {
    if (this.carouselIndex > 0) {
      this.carouselAnimationDirection = 'prev';
      this.carouselIndex--;
      this.saveDraft();
    }
  }

  goToCarouselStep(index: number) {
    this.carouselAnimationDirection = index > this.carouselIndex ? 'next' : 'prev';
    this.carouselIndex = index;
    this.saveDraft();
  }

  onTouchStart(e: TouchEvent) {
    this.touchStartX = e.changedTouches[0].screenX;
  }

  onTouchEnd(e: TouchEvent) {
    this.touchEndX = e.changedTouches[0].screenX;
    this.handleSwipe();
  }

  private handleSwipe() {
    const diff = this.touchEndX - this.touchStartX;
    if (Math.abs(diff) > 60) {
      if (diff < 0) {
        this.nextCarouselStep();
      } else {
        this.prevCarouselStep();
      }
    }
  }

  saveDraft() {
    if (!this.orderId) return;
    try {
      const draft = {
        checklist: this.vehicleChecklist,
        carouselIndex: this.carouselIndex,
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
          this.vehicleChecklist = draft.checklist;
        }
        if (typeof draft.carouselIndex === 'number') {
          this.carouselIndex = Math.min(draft.carouselIndex, this.checklistCategories.length);
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

  descargarFacturaPDF() {
    window.print();
  }

  enviarFacturaWhatsApp() {
    if (!this.order) return;
    const msg = `Hola *${this.order.cliente}*, le compartimos su Factura de Servicio en *Luxury Service Car Home* para su vehículo *${this.order.vehiculo}* (${this.order.placa}):\n\n` +
      `📄 *Factura:* #FAC-${this.order.id}\n` +
      `💰 *Subtotal:* $${this.subtotalFactura.toLocaleString()} COP\n` +
      `🏛️ *IVA (19%):* $${this.ivaFactura.toLocaleString()} COP\n` +
      `💳 *TOTAL:* $${this.totalFactura.toLocaleString()} COP\n` +
      `💵 *Forma de Pago:* ${this.formaPagoFactura}\n\n` +
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
    if (!accion) return '🟢';
    if (accion.includes('Ingresó')) return '📥';
    if (accion.includes('Checklist') || accion.includes('Recepción')) return '📋';
    if (accion.includes('Factura') || accion.includes('Cotización')) return '🧾';
    if (accion.includes('Entrega') || accion.includes('Cerró')) return '🏁';
    return '🟢';
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
