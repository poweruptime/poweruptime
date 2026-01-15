import {ChangeDetectionStrategy, Component, computed, signal} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';
import {NgIcon} from '@ng-icons/core';
import {HlmInputGroupButton} from '@spartan-ng/helm/input-group';

@Component({
  template: `
    @let _show = show();
    @let label =
      _show ? ('form.passwordShow.hide' | transloco) : ('form.passwordShow.show' | transloco);

    <button
      [attr.aria-label]="label"
      (click)="show.set(!_show)"
      hlmInputGroupButton
      size="icon-xs"
      type="button">
      @if (_show) {
        <ng-icon name="bootstrapEyeFill" />
      } @else {
        <ng-icon name="bootstrapEyeSlashFill" />
      }
    </button>
  `,
  selector: 'pu-password-show-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon, TranslocoPipe, HlmInputGroupButton],
})
export class PasswordShowButton {
  protected readonly show = signal(false);

  readonly type = computed(() => (this.show() ? 'text' : 'password'));
  readonly placeholder = computed(() => (this.show() ? 'secret password' : '*********'));
}
