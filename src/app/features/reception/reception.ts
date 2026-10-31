import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Sidebar } from '../../layout/sidebar/sidebar';
import { OrderService, OrderDto, CreateOrderDto } from '../../core/services/order';
import { NumbersOnlyDirective } from '../../core/directives/numbers-only.directive';
import { PlateFormatDirective } from '../../core/directives/plate-format.directive';
import { cleanVehicleTitle, formatPlateDisplay } from '../../core/utils/vehicle-utils';

import { IconComponent } from '../../shared/ui/icon/icon.component';

@Component({
  selector: 'app-reception',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    Sidebar,
    NumbersOnlyDirective,
    PlateFormatDirective,
    IconComponent
  ],
  templateUrl: './reception.html',
  styleUrl: './reception.css'
})
export class Reception implements OnInit {
  receptionForm: FormGroup;
  fotos: string[] = [];
  isLoading = false;
  errorMessage = '';

  // Redundancia y prevención de duplicados
  allOrders: OrderDto[] = [];
  activeOrderConflict: OrderDto | null = null;
  knownVehicleSuggestion: OrderDto | null = null;
  
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private orderService: OrderService,
    private cdr: ChangeDetectorRef
  ) {
    this.receptionForm = this.fb.group({
      // Cliente
      nombreCliente: ['', [Validators.required, Validators.minLength(3)]],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      documento: ['', [Validators.required, Validators.pattern(/^[0-9]{6,12}$/)]],
      
      // Vehículo: Formato de placa: 3 letras mayúsculas seguidas de números (máximo 6)
      placa: ['', [Validators.required, Validators.pattern(/^[A-Z]{3}[0-9]{2,3}[A-Z]?$/)]],
      marca: ['', [Validators.required, Validators.minLength(2)]],
      modelo: ['', [Validators.required, Validators.minLength(2)]],
      color: ['', [Validators.required, Validators.minLength(3)]],
      
      // Detalles
      pertenencias: [''],
      observaciones: ['']
    });
  }

  ngOnInit(): void {
    // Cargar órdenes existentes para validación de redundancia en placas
    this.orderService.getAll().subscribe({
      next: (orders) => {
        this.allOrders = orders || [];
        this.checkPlateRedundancy(this.receptionForm.get('placa')?.value);
      },
      error: (err) => console.warn('No se pudieron precargar órdenes para validación de placa:', err)
    });

    // Escuchar cambios en la placa para prevenir redundancias y duplicados en tiempo real
    this.receptionForm.get('placa')?.valueChanges.subscribe((val: string) => {
      this.checkPlateRedundancy(val);
    });
  }

  checkPlateRedundancy(val: string | null | undefined): void {
    const clean = (val || '').trim().toUpperCase();
    if (!clean || clean.length < 5) {
      this.activeOrderConflict = null;
      this.knownVehicleSuggestion = null;
      this.cdr.markForCheck();
      return;
    }

    // 1. Detectar si ya existe una orden activa en proceso para esta placa (evitar orden duplicada redundante)
    const active = this.allOrders.find(
      o => o.placa?.toUpperCase() === clean && o.pasoActual < 6
    );
    this.activeOrderConflict = active || null;

    // 2. Si no hay conflicto activo, revisar si estuvo previamente para sugerir autocompletar
    if (!this.activeOrderConflict) {
      const past = this.allOrders.find(o => o.placa?.toUpperCase() === clean);
      this.knownVehicleSuggestion = past || null;
    } else {
      this.knownVehicleSuggestion = null;
    }

    this.cdr.markForCheck();
  }

  useKnownVehicleData(order: OrderDto): void {
    const cleanedTitle = cleanVehicleTitle(order.vehiculo, order.placa);
    // Intenta extraer marca y modelo del texto existente si están combinados
    const parts = cleanedTitle.split(' ');
    const suggestedMarca = parts[0] || '';
    const suggestedModelo = parts.slice(1).join(' ') || '';

    this.receptionForm.patchValue({
      nombreCliente: order.cliente || this.receptionForm.get('nombreCliente')?.value,
      telefono: order.telefono || this.receptionForm.get('telefono')?.value,
      documento: order.documento || this.receptionForm.get('documento')?.value,
      marca: suggestedMarca || this.receptionForm.get('marca')?.value,
      modelo: suggestedModelo || this.receptionForm.get('modelo')?.value,
    });

    this.knownVehicleSuggestion = null;
    this.cdr.markForCheck();
  }

  cleanTitle(vehiculo: string, placa?: string): string {
    return cleanVehicleTitle(vehiculo, placa);
  }

  formatPlate(placa?: string): string {
    return formatPlateDisplay(placa);
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.receptionForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getFieldError(fieldName: string): string {
    const control = this.receptionForm.get(fieldName);
    if (!control || !control.errors) return '';

    if (control.errors['required']) return 'Este campo es obligatorio.';
    if (control.errors['minlength']) {
      return `Debe tener al menos ${control.errors['minlength'].requiredLength} caracteres.`;
    }
    if (control.errors['pattern']) {
      if (fieldName === 'placa') return 'Formato requerido: 3 letras mayúsculas seguidas de números (Ej: ABC123 o ABC12D).';
      if (fieldName === 'telefono') return 'El teléfono debe contener exactamente 10 dígitos numéricos (Ej: 3001234567).';
      if (fieldName === 'documento') return 'El documento debe contener entre 6 y 12 dígitos numéricos.';
    }
    return 'Dato inválido.';
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      if (this.fotos.length >= 5) break;
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.fotos.push(e.target.result);
        this.cdr.markForCheck();
      };
      reader.readAsDataURL(file);
    }
    event.target.value = '';
  }

  removeFoto(index: number) {
    this.fotos.splice(index, 1);
    this.cdr.markForCheck();
  }

  onSubmit() {
    if (this.receptionForm.invalid) {
      this.receptionForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const formValue = this.receptionForm.value;
    const cleanPlaca = formValue.placa.trim().toUpperCase();

    const dto: CreateOrderDto = {
      nombreCliente: formValue.nombreCliente.trim(),
      telefono: formValue.telefono.trim(),
      documento: formValue.documento.trim(),
      placa: cleanPlaca,
      marca: formValue.marca.trim(),
      modelo: formValue.modelo.trim(),
      color: formValue.color.trim(),
      kilometraje: 0,
      nivelCombustible: 'N/A',
      pertenencias: (formValue.pertenencias || '').trim(),
      observaciones: (formValue.observaciones || '').trim(),
      fotos: this.fotos,
    };

    this.orderService.create(dto).subscribe({
      next: (order) => {
        this.isLoading = false;
        alert(`Orden ${order.id} creada exitosamente para la placa ${cleanPlaca}`);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage =
          err.status === 401
            ? 'No autorizado. Por favor inicie sesión nuevamente.'
            : (err.error?.message || 'Error al crear la orden. Verifique la conexión con el servidor.');
        console.error('Error al crear orden:', err);
      }
    });
  }
}
