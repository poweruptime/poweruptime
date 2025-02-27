import {ChangeDetectionStrategy, Component, input, signal} from '@angular/core';
import {MatIconButton} from '@angular/material/button';
import {MatTooltip, TooltipPosition} from '@angular/material/tooltip';

import {TranslocoPipe} from '@jsverse/transloco';
import {cl_copy} from 'dfts-helper';
import {BiComponent} from 'dfx-bootstrap-icons';
import {toast} from 'ngx-sonner';

@Component({
  selector: 'pu-copy-icon-button',
  imports: [BiComponent, MatIconButton, MatTooltip, TranslocoPipe],
  template: `
    <button
      [matTooltip]="'general.copy' | transloco"
      [matTooltipPosition]="matTooltipPosition()"
      [attr.aria-label]="'general.copy' | transloco"
      (click)="copy()"
      type="button"
      mat-icon-button>
      @if (state() === 'BUTTON') {
        <bi name="clipboard" />
      } @else {
        <bi class="text-blue-700 dark:text-blue-500" name="clipboard-check-fill" />
      }
    </button>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CopyIconButton {
  content = input.required<string | undefined | null>();

  matTooltipPosition = input<TooltipPosition>('above');

  state = signal<'BUTTON' | 'CHECK'>('BUTTON');

  copy(): void {
    const content = this.content();
    if (content) {
      cl_copy(content);
      toast('Copied!');
      this.state.set('CHECK');

      setTimeout(() => this.state.set('BUTTON'), 2000);
    }
  }
}
