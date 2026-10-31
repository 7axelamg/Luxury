import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type StatusVariant = 'ok' | 'attention' | 'critical' | 'default';

@Component({
  selector: 'app-status-pill',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="inline-flex items-center gap-2 px-2.5 py-1 text-xs font-medium border select-none"
      [ngClass]="variantClasses[status]"
      [style.border-radius.px]="6"
    >
      <span class="w-1.5 h-1.5 rounded-full" [ngClass]="dotClasses[status]"></span>
      <span><ng-content></ng-content></span>
    </span>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
  `]
})
export class StatusPillComponent {
  @Input() status: StatusVariant = 'default';

  readonly variantClasses: Record<StatusVariant, string> = {
    default: 'bg-[#F7F7F8] border-[#E5E5E8] text-[#6B6B76]',
    ok: 'bg-[rgba(31,122,77,0.10)] border-[rgba(31,122,77,0.20)] text-[#1F7A4D]',
    attention: 'bg-[rgba(183,121,31,0.10)] border-[rgba(183,121,31,0.20)] text-[#B7791F]',
    critical: 'bg-[rgba(200,16,46,0.10)] border-[rgba(200,16,46,0.20)] text-[#C8102E]'
  };

  readonly dotClasses: Record<StatusVariant, string> = {
    default: 'bg-[#6B6B76]',
    ok: 'bg-[#1F7A4D]',
    attention: 'bg-[#B7791F]',
    critical: 'bg-[#C8102E]'
  };
}
