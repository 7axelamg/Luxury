import { Directive, ElementRef, HostListener, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appUppercase]',
  standalone: true
})
export class UppercaseDirective {
  private el = inject(ElementRef);
  private ngControl = inject(NgControl, { optional: true });

  @HostListener('input', ['$event'])
  onInputChange(event: Event): void {
    const input = this.el.nativeElement as HTMLInputElement;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const upperValue = (input.value || '').toUpperCase();

    if (input.value !== upperValue) {
      input.value = upperValue;
      if (this.ngControl?.control) {
        this.ngControl.control.setValue(upperValue, { emitEvent: false });
      }
      input.setSelectionRange(start, end);
    }
  }
}
