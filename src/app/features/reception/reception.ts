import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Sidebar } from '../../layout/sidebar/sidebar';
import { OrderService, CreateOrderDto } from '../../core/services/order';
import { NumbersOnlyDirective } from '../../core/directives/numbers-only.directive';
import { UppercaseDirective } from '../../core/directives/uppercase.directive';

@Component({
  selector: 'app-reception',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    Sidebar,
    NumbersOnlyDirective,
    UppercaseDirective
  ],
  templateUrl: './reception.html',
  styleUrl: './reception.css'
})
export class Reception {
  receptionForm: FormGroup;
  fotos: string[] = [];
  isLoading = false;
  errorMessage = '';
  
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
      
      // Vehículo
      placa: ['', [Validators.required, Validators.pattern(/^[A-Z0-9]{5,6}$/)]],
      marca: ['', [Validators.required, Validators.minLength(2)]],
      modelo: ['', [Validators.required, Validators.minLength(2)]],
      color: ['', [Validators.required, Validators.minLength(3)]],
      
      // Detalles
      pertenencias: [''],
      observaciones: ['']
    });
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
      if (fieldName === 'placa') return 'La placa debe tener 5 o 6 caracteres alfanuméricos sin símbolos ni espacios (Ej: ABC123).';
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
    const dto: CreateOrderDto = {
      nombreCliente: formValue.nombreCliente.trim(),
      telefono: formValue.telefono.trim(),
      documento: formValue.documento.trim(),
      placa: formValue.placa.trim().toUpperCase(),
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
        alert(`✅ Orden ${order.id} creada exitosamente`);
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
