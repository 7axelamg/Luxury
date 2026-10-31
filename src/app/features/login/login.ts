import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  loginForm: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;
  showPassword: boolean = false;
  showQuickDemo: boolean = false;

  readonly demoRoles = [
    { label: 'Director / Admin', user: 'admin', pass: 'admin123', badge: 'Super Admin' },
    { label: 'Gerente Comercial', user: 'gerente', pass: 'gerente123', badge: 'Super Admin' },
    { label: 'Lubricador / Taller', user: 'lubricador', pass: 'lubricador123', badge: 'Lubricador' },
    { label: 'Recepción VIP', user: 'recepcion', pass: 'recepcion123', badge: 'Recepción' },
  ];

  constructor(private fb: FormBuilder, private router: Router, private authService: AuthService) {
    this.loginForm = this.fb.group({
      usuario: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleQuickDemo(): void {
    this.showQuickDemo = !this.showQuickDemo;
  }

  fillRole(user: string, pass: string): void {
    this.loginForm.setValue({
      usuario: user,
      password: pass,
    });
    this.errorMessage = '';
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const { usuario, password } = this.loginForm.value;

    this.authService.login(usuario, password).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage =
          err.status === 401
            ? 'Credenciales no válidas. Verifique usuario y contraseña corporativa.'
            : 'No fue posible conectar con el servidor central de Luxury Services.';
      },
    });
  }
}
