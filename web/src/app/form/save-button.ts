import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';
import {NgIcon} from '@ng-icons/core';
import {HlmButtonImports} from '@spartan-ng/helm/button';

@Component({
  template: `
    <button
      [disabled]="!valid()"
      [attr.form]="form()"
      [type]="type()"
      (click)="buttonClick.emit()"
      hlmBtn>
      <ng-icon class="text-[length:--spacing(4)]" [name]="icon()" />
      <!-- t(general.save) -->
      {{ text() ?? ('general.save' | transloco) }}
    </button>
  `,
  selector: 'pu-save-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe, HlmButtonImports, NgIcon],
})
export class SaveButton {
  valid = input(false);
  text = input<string>();
  form = input('form');
  type = input('submit');
  /* i(lucideDownload) */
  icon = input<string>('lucideDownload');

  buttonClick = output();
}
