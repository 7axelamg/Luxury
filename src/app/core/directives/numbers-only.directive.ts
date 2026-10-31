import { Directive, ElementRef, HostListener, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appNumbersOnly]',
  standalone: true
})
export class NumbersOnlyDirective {
  private el = inject(ElementRef);
  private ngControl = inject(NgControl, { optional: true });

  @HostListener('input', ['$event'])
  onInputChange(event: Event): void {
    const initialValue = this.el.nativeElement.value;
    const cleanValue = initialValue.replace(/[^0-9]/g, '');

    if (initialValue !== cleanValue) {
      this.el.nativeElement.value = cleanValue;
      if (this.ngControl?.control) {
        this.ngControl.control.setValue(cleanValue, { emitEvent: false });
      }
      event.stopPropagation();
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedInput = event.clipboardData?.getData('text/plain') || '';
    const cleanValue = pastedInput.replace(/[^0-9]/g, '');
    
    // Inserta solo los dígitos en la posición actual
    const input = this.el.nativeElement as HTMLInputElement;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const currentValue = input.value;
    const newValue = currentValue.slice(0, start) + cleanValue + currentValue.slice(end);

    input.value = newValue;
    if (this.ngControl?.control) {
      this.ngControl.control.setValue(newValue);
    }
  }

  @HostListener('keypress', ['$event'])
  onKeyPress(event: KeyboardEvent): void {
    // Permite teclas de control (backspace, delete, flechas, etc.)
    if (event.ctrlKey || event.altKey || event.metaKey) return;
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      event.preventDefault();
    }
  }
}
