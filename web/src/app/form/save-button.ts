import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';

import {MatFabButton} from '@angular/material/button';

import {TranslocoPipe} from '@jsverse/transloco';
import {BiComponent, BiName, provideBi, withSize} from 'dfx-bootstrap-icons';

@Component({
  template: `
    <button
      class="flex min-w-28 items-center"
      [disabled]="!valid()"
      [attr.form]="form()"
      [type]="type()"
      (click)="buttonClick.emit()"
      mat-fab
      extended>
      <bi [name]="icon()" />
      <!-- t(general.save) -->
      <span class="ms-2 text-lg">{{ text() ?? ('general.save' | transloco) }}</span>
    </button>
  `,
  selector: 'pu-save-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BiComponent, TranslocoPipe, MatFabButton],
  providers: [provideBi(withSize('20'))],
})
export class SaveButton {
  valid = input(false);
  text = input<string>();
  form = input('form');
  type = input('submit');
  icon = input<BiName>('save');

  buttonClick = output();
}
