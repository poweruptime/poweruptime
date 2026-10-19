import {ChangeDetectionStrategy, Component, inject, input, signal} from '@angular/core';

import {TranslocoService} from '@jsverse/transloco';
import {NgIcon} from '@ng-icons/core';
import {toast} from '@spartan-ng/brain/sonner';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {cl_copy} from 'dfts-helper';

@Component({
  template: `
    <button (click)="copy()" size="sm" type="button" hlmBtn variant="secondary">
      <ng-content />
      @if (state() === 'BUTTON') {
        <ng-icon class="text-[length:--spacing(4)]" name="lucideCopy" />
      } @else {
        <ng-icon
          class="text-[length:--spacing(4)] text-blue-700 dark:text-blue-500"
          name="lucideClipboardCheck" />
      }
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'pu-copy-button',
  imports: [NgIcon, HlmButtonImports],
})
export class CopyButton {
  content = input.required<string | undefined | null>();

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
