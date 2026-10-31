import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="bg-white border border-[#E5E5E8] transition-colors relative"
      [ngClass]="[
        paddingClasses[padding],
        hoverable ? 'hover:border-[#111111]' : '',
        clickable ? 'cursor-pointer' : '',
        shadow ? 'shadow-[0_1px_3px_rgba(17,17,17,0.05)]' : ''
      ]"
      [style.border-radius.px]="8"
    >
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class CardComponent {
  @Input() padding: CardPadding = 'md';
  @Input() hoverable = false;
  @Input() clickable = false;
  @Input() shadow = false;

  readonly paddingClasses: Record<CardPadding, string> = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4 sm:p-5',
    lg: 'p-6 sm:p-8'
  };
}
