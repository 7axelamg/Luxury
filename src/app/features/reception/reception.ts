import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Sidebar } from '../../layout/sidebar/sidebar';
import { OrderService, OrderDto, CreateOrderDto } from '../../core/services/order';
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
    PlateFormatDirective,
    IconComponent
  ],
  templateUrl: './reception.html',
  styleUrl: './reception.css'
})
export class Reception implements OnInit {
  receptionForm: FormGroup;
  isLoading = false;
  errorMessage = '';

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
      placa: ['', [Validators.required, Validators.pattern(/^[A-Z0-9]{5,6}$/)]],
      vehiculo: ['', [Validators.required, Validators.minLength(2)]]
    });
  }

  ngOnInit(): void {
    this.orderService.getAll().subscribe({
      next: (orders) => {
        this.allOrders = orders || [];
        this.checkPlateRedundancy(this.receptionForm.get('placa')?.value);
      },
      error: (err) => console.warn('No se pudieron precargar órdenes:', err)
    });

    this.receptionForm.get('placa')?.valueChanges.subscribe((val: string) => {
      this.checkPlateRedundancy(val);
    });
  }

  checkPlateRedundancy(val: string | null | undefined): void {
    const clean = (val || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!clean || clean.length < 5) {
      this.activeOrderConflict = null;
      this.knownVehicleSuggestion = null;
      this.cdr.markForCheck();
      return;
    }

    const active = this.allOrders.find(
      o => o.placa?.toUpperCase().replace(/[^A-Z0-9]/g, '') === clean && o.pasoActual < 3
    );
    this.activeOrderConflict = active || null;

    if (!this.activeOrderConflict) {
      const past = this.allOrders.find(
        o => o.placa?.toUpperCase().replace(/[^A-Z0-9]/g, '') === clean
      );
      this.knownVehicleSuggestion = past || null;
    } else {
      this.knownVehicleSuggestion = null;
    }

    this.cdr.markForCheck();
  }

  useKnownVehicleData(order: OrderDto): void {
    const suggestedVehiculo = cleanVehicleTitle(order.vehiculo, order.placa);
    this.receptionForm.patchValue({
      vehiculo: suggestedVehiculo || order.vehiculo
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
      if (fieldName === 'placa') return 'Formato requerido: 5 o 6 caracteres alfanuméricos sin espacios.';
    }
    return 'Dato inválido.';
  }

  onSubmit() {
    if (this.receptionForm.invalid) {
      this.receptionForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const formValue = this.receptionForm.value;
    const cleanPlaca = formValue.placa.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

    const dto: CreateOrderDto = {
      placa: cleanPlaca,
      vehiculo: formValue.vehiculo.trim()
    };

    this.orderService.create(dto).subscribe({
      next: (order) => {
        this.isLoading = false;
        this.router.navigate(['/order', order.id]);
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
