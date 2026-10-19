import {ChangeDetectionStrategy, Component, computed, inject, input, signal} from '@angular/core';

import {TranslocoPipe, TranslocoService} from '@jsverse/transloco';
import {NgIcon} from '@ng-icons/core';
import {toast} from '@spartan-ng/brain/sonner';
import {BrnTooltipPosition} from '@spartan-ng/brain/tooltip';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmTooltipImports} from '@spartan-ng/helm/tooltip';
import {cl_copy} from 'dfts-helper';

@Component({
  template: `
    @let _size = size();
    <button
      [position]="tooltipPosition()"
      [attr.aria-label]="'general.copy' | transloco"
      [size]="$any('icon-' + _size)"
      [hlmTooltip]="'general.copy' | transloco"
      (click)="copy()"
      type="button"
      hlmBtn
      variant="ghost">
      @if (state() === 'BUTTON') {
        <ng-icon [class]="iconClass()" name="lucideCopy" />
      } @else {
        <ng-icon
          class="text-blue-700 dark:text-blue-500"
          [class]="iconClass()"
          name="lucideClipboardCheck" />
      }
    </button>
  `,
  host: {
    '[class]': 'classSize()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'pu-copy-icon-button',
  imports: [TranslocoPipe, NgIcon, HlmTooltipImports, HlmButtonImports],
})
export class CopyIconButton {
  private readonly translocoService = inject(TranslocoService);

  public readonly content = input.required<string | undefined | null>();
  public readonly tooltipPosition = input<BrnTooltipPosition>('top');
  public readonly size = input<'sm' | 'xs'>('sm');

  protected readonly state = signal<'BUTTON' | 'CHECK'>('BUTTON');
  protected readonly classSize = computed(() => (this.size() === 'sm' ? 'size-8' : 'size-6'));
  protected readonly iconClass = computed(() =>
    this.size() === 'sm' ? 'text-[length:--spacing(4)]' : 'text-[length:--spacing(3)]',
  );

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
