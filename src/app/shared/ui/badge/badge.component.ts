import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeVariant = 'default' | 'ok' | 'attention' | 'critical' | 'brand';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider border select-none"
      [ngClass]="variantClasses[variant]"
      [style.border-radius.px]="6"
    >
      <ng-content select="[prefix]"></ng-content>
      <span><ng-content></ng-content></span>
      <ng-content select="[suffix]"></ng-content>
    </span>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
  `]
})
export class BadgeComponent {
  @Input() variant: BadgeVariant = 'default';

  readonly variantClasses: Record<BadgeVariant, string> = {
    default: 'bg-[#F7F7F8] border-[#E5E5E8] text-[#6B6B76]',
    ok: 'bg-[rgba(31,122,77,0.10)] border-[rgba(31,122,77,0.25)] text-[#1F7A4D]',
    attention: 'bg-[rgba(183,121,31,0.10)] border-[rgba(183,121,31,0.25)] text-[#B7791F]',
    critical: 'bg-[rgba(200,16,46,0.10)] border-[rgba(200,16,46,0.25)] text-[#C8102E]',
    brand: 'bg-[#111111] border-[#111111] text-white'
  };
}
