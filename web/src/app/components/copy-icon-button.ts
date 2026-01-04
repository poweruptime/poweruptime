import {ChangeDetectionStrategy, Component, inject, input, signal} from '@angular/core';

import {TooltipPosition} from '@angular/material/tooltip';

import {TranslocoPipe, TranslocoService} from '@jsverse/transloco';
import {BrnTooltipContentTemplate} from '@spartan-ng/brain/tooltip';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmTooltipImports} from '@spartan-ng/helm/tooltip';
import {cl_copy} from 'dfts-helper';
import {toast} from 'ngx-sonner';

@Component({
  template: `
    <hlm-tooltip>
      <button
        [position]="matTooltipPosition()"
        [attr.aria-label]="'general.copy' | transloco"
        (click)="copy()"
        hlmTooltipTrigger
        size="icon"
        type="button"
        hlmBtn
        variant="ghost">
        @if (state() === 'BUTTON') {
          <ng-icon hlm name="lucideCopy" size="sm" />
        } @else {
          <ng-icon
            class="text-blue-700 dark:text-blue-500"
            hlm
            name="lucideClipboardCheck"
            size="sm" />
        }
      </button>
      <span *brnTooltipContent>{{ 'general.copy' | transloco }}</span>
    </hlm-tooltip>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'pu-copy-icon-button',
  imports: [
    TranslocoPipe,
    HlmIconImports,
    HlmTooltipImports,
    HlmButtonImports,
    BrnTooltipContentTemplate,
  ],
})
export class CopyIconButton {
  content = input.required<string | undefined | null>();

  matTooltipPosition = input<TooltipPosition>('above');

  readonly state = signal<'BUTTON' | 'CHECK'>('BUTTON');

  private readonly translocoService = inject(TranslocoService);

  copy(): void {
    const content = this.content();
    if (content) {
      cl_copy(content);
      toast(this.translocoService.translate('general.copied'));
      this.state.set('CHECK');

      setTimeout(() => this.state.set('BUTTON'), 2000);
    }
  }
}
