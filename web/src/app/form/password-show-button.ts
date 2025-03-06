import {ChangeDetectionStrategy, Component, computed, signal} from '@angular/core';
import {MatIconButton} from '@angular/material/button';
import {MatTooltip} from '@angular/material/tooltip';

import {TranslocoPipe} from '@jsverse/transloco';
import {BiComponent} from 'dfx-bootstrap-icons';

@Component({
  template: `
    @let _show = show();
    @let label =
      _show ? ('form.passwordShow.hide' | transloco) : ('form.passwordShow.show' | transloco);

    <button
      [attr.aria-label]="label"
      [matTooltip]="label"
      (click)="show.set(!_show)"
      type="button"
      mat-icon-button>
      @if (_show) {
        <bi name="eye-fill" />
      } @else {
        <bi name="eye-slash-fill" />
      }
    </button>
  `,
  selector: 'pu-password-show-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BiComponent, MatIconButton, TranslocoPipe, MatTooltip],
})
export class PasswordShowButton {
  readonly show = signal(false);

  readonly type = computed(() => (this.show() ? 'text' : 'password'));
}
