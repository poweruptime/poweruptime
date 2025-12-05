import {ChangeDetectionStrategy, Component, inject, input, signal} from '@angular/core';

import {MatIconButton} from '@angular/material/button';
import {MatTooltip, TooltipPosition} from '@angular/material/tooltip';

import {TranslocoPipe, TranslocoService} from '@jsverse/transloco';
import {NgIcon} from '@ng-icons/core';
import {cl_copy} from 'dfts-helper';
import {toast} from 'ngx-sonner';

@Component({
  selector: 'pu-copy-icon-button',
  imports: [NgIcon, MatIconButton, MatTooltip, TranslocoPipe],
  template: `
    <button
      [matTooltip]="'general.copy' | transloco"
      [matTooltipPosition]="matTooltipPosition()"
      [attr.aria-label]="'general.copy' | transloco"
      (click)="copy()"
      type="button"
      mat-icon-button>
      @if (state() === 'BUTTON') {
        <ng-icon name="bootstrapClipboard" />
      } @else {
        <ng-icon class="text-blue-700 dark:text-blue-500" name="bootstrapCheckLg" />
      }
    </button>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
