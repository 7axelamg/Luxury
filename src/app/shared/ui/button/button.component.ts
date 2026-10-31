import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'critical';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      (click)="onClick($event)"
      class="inline-flex items-center justify-center font-sans font-medium transition-colors select-none text-center cursor-pointer border focus:outline-none"
      [ngClass]="[
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'w-full' : '',
        disabled || loading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
      ]"
      [style.border-radius.px]="6"
    >
      @if (loading) {
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      }
      <ng-content select="[prefix]"></ng-content>
      <span class="inline-flex items-center gap-1.5"><ng-content></ng-content></span>
      <ng-content select="[suffix]"></ng-content>
    </button>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
  `]
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'secondary';
  @Input() size: ButtonSize = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() fullWidth = false;

  @Output() clicked = new EventEmitter<MouseEvent>();

  readonly variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-[#C8102E] text-white border-transparent hover:bg-[#A50D26] active:bg-[#880B1F]',
    secondary: 'bg-white text-[#111111] border-[#E5E5E8] hover:bg-[#F7F7F8] active:bg-[#E5E5E8]',
    outline: 'bg-transparent text-[#111111] border-[#E5E5E8] hover:bg-[#F7F7F8]',
    ghost: 'bg-transparent text-[#111111] border-transparent hover:bg-[#F7F7F8]',
    critical: 'bg-[#C8102E] text-white border-transparent hover:bg-[#A50D26]'
  };

  readonly sizeClasses: Record<ButtonSize, string> = {
    sm: 'text-xs h-8 px-3 gap-1.5',
    md: 'text-sm h-10 px-4 gap-2',
    lg: 'text-base h-12 px-5 gap-2.5'
  };

  onClick(event: MouseEvent) {
    if (!this.disabled && !this.loading) {
      this.clicked.emit(event);
    }
  }
}
