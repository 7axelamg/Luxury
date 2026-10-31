import { Directive, ElementRef, HostListener, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

/**
 * Directiva para formateo de placas automotrices:
 * - Convierte automáticamente las letras a mayúsculas.
 * - Asegura que las letras van al inicio seguidas estrictamente de números (Ej: ABC123 o ABC12D en motos).
 * - Elimina redundancias, espacios, guiones y caracteres inválidos en tiempo real.
 * - Longitud máxima: 6 caracteres.
 */
@Directive({
  selector: '[appPlateFormat]',
  standalone: true
})
export class PlateFormatDirective {
  private el = inject(ElementRef<HTMLInputElement>);
  private ngControl = inject(NgControl, { optional: true });

  /**
   * Limpia y formatea el valor ingresado:
   * Posiciones 0 a 2: estrictamente letras A-Z.
   * Posiciones 3 a 5: dígitos 0-9 (o letra en posición 5 para motos colombianas ej. ABC12D).
   */
  public static sanitizePlate(raw: string): string {
    if (!raw) return '';
    // Mayúsculas y quitar caracteres no alfanuméricos
    const cleanChars = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
    let result = '';

    for (let i = 0; i < cleanChars.length && result.length < 6; i++) {
      const char = cleanChars[i];
      const isLetter = /[A-Z]/.test(char);
      const isDigit = /[0-9]/.test(char);

      if (result.length < 3) {
        // Los primeros 3 caracteres deben ser letras
        if (isLetter) {
          result += char;
        }
      } else if (result.length < 5) {
        // Los caracteres 4 y 5 deben ser números
        if (isDigit) {
          result += char;
        }
      } else if (result.length === 5) {
        // El 6to caracter puede ser número (carro: ABC123) o letra (moto: ABC12D)
        if (isDigit || isLetter) {
          result += char;
        }
      }
    }

    return result;
  }

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = this.el.nativeElement;
    const originalValue = input.value || '';
    const formatted = PlateFormatDirective.sanitizePlate(originalValue);

    if (originalValue !== formatted) {
      input.value = formatted;
      if (this.ngControl?.control) {
        this.ngControl.control.setValue(formatted, { emitEvent: true });
      }
      event.stopPropagation();
    } else if (this.ngControl?.control && this.ngControl.control.value !== formatted) {
      this.ngControl.control.setValue(formatted, { emitEvent: false });
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text/plain') || '';
    const input = this.el.nativeElement;
    const current = input.value || '';
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;

    const merged = current.slice(0, start) + pastedText + current.slice(end);
    const formatted = PlateFormatDirective.sanitizePlate(merged);

    input.value = formatted;
    if (this.ngControl?.control) {
      this.ngControl.control.setValue(formatted);
    }
  }

  @HostListener('keypress', ['$event'])
  onKeyPress(event: KeyboardEvent): void {
    // Permitir teclas de navegación / comandos
    if (event.ctrlKey || event.altKey || event.metaKey) return;
    const key = event.key;
    if (key.length !== 1) return; // Teclas como Enter, Tab, etc.

    const input = this.el.nativeElement;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const current = input.value || '';

    // Si ya tiene 6 caracteres y no hay texto seleccionado para reemplazar
    if (current.length >= 6 && start === end) {
      event.preventDefault();
      return;
    }

    const upperKey = key.toUpperCase();
    const isLetter = /[A-Z]/.test(upperKey);
    const isDigit = /[0-9]/.test(upperKey);

    // Si estamos en las primeras 3 posiciones, solo se admiten letras
    if (start < 3) {
      if (!isLetter) {
        event.preventDefault();
      }
    } else if (start < 5) {
      // Posiciones 4 y 5 solo admiten números
      if (!isDigit) {
        event.preventDefault();
      }
    } else if (start === 5) {
      // Posición 6 admite dígito o letra (motos)
      if (!isDigit && !isLetter) {
        event.preventDefault();
      }
    }
  }
}
