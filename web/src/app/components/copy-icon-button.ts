import {ChangeDetectionStrategy, Component, computed, inject, input, signal} from '@angular/core';

import {TranslocoPipe, TranslocoService} from '@jsverse/transloco';
import {BrnTooltipContentTemplate, TooltipPosition} from '@spartan-ng/brain/tooltip';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmTooltipImports} from '@spartan-ng/helm/tooltip';
import {cl_copy} from 'dfts-helper';
import {toast} from 'ngx-sonner';

@Component({
  template: `
    @let _size = size();
    <hlm-tooltip>
      <button
        [position]="tooltipPosition()"
        [attr.aria-label]="'general.copy' | transloco"
        [size]="$any('icon-' + _size)"
        (click)="copy()"
        hlmTooltipTrigger
        type="button"
        hlmBtn
        variant="ghost">
        @if (state() === 'BUTTON') {
          <ng-icon [size]="_size" hlm name="lucideCopy" />
        } @else {
          <ng-icon
            class="text-blue-700 dark:text-blue-500"
            [size]="_size"
            hlm
            name="lucideClipboardCheck" />
        }
      </button>
      <span *brnTooltipContent>{{ 'general.copy' | transloco }}</span>
    </hlm-tooltip>
  `,
  host: {
    '[class]': 'classSize()',
  },
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
  private readonly translocoService = inject(TranslocoService);

  public readonly content = input.required<string | undefined | null>();
  public readonly tooltipPosition = input<TooltipPosition>('above');
  public readonly size = input<'sm' | 'xs'>('sm');

  protected readonly state = signal<'BUTTON' | 'CHECK'>('BUTTON');
  protected readonly classSize = computed(() => (this.size() === 'sm' ? 'size-8' : 'size-6'));

  protected copy(): void {
    const content = this.content();
    if (content) {
      cl_copy(content);
      toast(this.translocoService.translate('general.copied'));
      this.state.set('CHECK');

      setTimeout(() => this.state.set('BUTTON'), 2000);
    }
  }
}
