import {ChangeDetectionStrategy, Component, signal} from '@angular/core';
import {MatIconButton} from '@angular/material/button';

import {TranslocoPipe} from '@jsverse/transloco';
import {BiComponent} from 'dfx-bootstrap-icons';

@Component({
  template: `
    @let _show = show();

    <button
      [attr.aria-label]="
        _show ? ('form.passwordShow.hide' | transloco) : ('form.passwordShow.hide' | transloco)
      "
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
  imports: [BiComponent, MatIconButton, TranslocoPipe],
})
export class PasswordShowButton {
  readonly show = signal(false);
}
