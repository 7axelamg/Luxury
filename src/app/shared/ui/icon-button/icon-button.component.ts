import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../icon/icon.component';

export type IconButtonVariant = 'ghost' | 'secondary' | 'primary' | 'critical';
export type IconButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-icon-button',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <button
      [type]="type"
      [disabled]="disabled"
      [attr.aria-label]="ariaLabel"
      [attr.title]="title || ariaLabel"
      (click)="onClick($event)"
      class="inline-flex items-center justify-center transition-colors cursor-pointer border focus:outline-none"
      [ngClass]="[
        variantClasses[variant],
        sizeClasses[size],
        disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
      ]"
      [style.border-radius.px]="6"
    >
      <app-icon [name]="icon" [size]="iconSizes[size]"></app-icon>
    </button>
  `,
  styles: [`
    :host {
      display: inline-block;
      line-height: 0;
    }
  `]
})
export class IconButtonComponent {
  @Input() icon: IconName | string = 'circle';
  @Input() variant: IconButtonVariant = 'ghost';
  @Input() size: IconButtonSize = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() ariaLabel = 'Botón';
  @Input() title = '';

  @Output() clicked = new EventEmitter<MouseEvent>();

  readonly variantClasses: Record<IconButtonVariant, string> = {
    ghost: 'bg-transparent text-[#6B6B76] border-transparent hover:text-[#111111] hover:bg-[#F7F7F8]',
    secondary: 'bg-white text-[#111111] border-[#E5E5E8] hover:bg-[#F7F7F8]',
    primary: 'bg-[#C8102E] text-white border-transparent hover:bg-[#A50D26]',
    critical: 'bg-transparent text-[#C8102E] border-transparent hover:bg-[rgba(200,16,46,0.10)]'
  };

  readonly sizeClasses: Record<IconButtonSize, string> = {
    sm: 'w-7 h-7 p-1',
    md: 'w-9 h-9 p-1.5',
    lg: 'w-11 h-11 p-2'
  };

  readonly iconSizes: Record<IconButtonSize, number> = {
    sm: 14,
    md: 18,
    lg: 22
  };

  onClick(event: MouseEvent) {
    if (!this.disabled) {
      this.clicked.emit(event);
    }
  }
}
