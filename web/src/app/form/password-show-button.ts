import {ChangeDetectionStrategy, Component, computed, signal} from '@angular/core';

import {MatIconButton} from '@angular/material/button';
import {MatTooltip} from '@angular/material/tooltip';

import {TranslocoPipe} from '@jsverse/transloco';
import {NgIcon} from '@ng-icons/core';

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
        <ng-icon name="bootstrapEyeFill" />
      } @else {
        <ng-icon name="bootstrapEyeSlashFill" />
      }
    </button>
  `,
  selector: 'pu-password-show-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon, MatIconButton, TranslocoPipe, MatTooltip],
})
export class PasswordShowButton {
  readonly show = signal(false);

  readonly type = computed(() => (this.show() ? 'text' : 'password'));
}
