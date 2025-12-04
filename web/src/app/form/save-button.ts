import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';

import {MatFabButton} from '@angular/material/button';

import {TranslocoPipe} from '@jsverse/transloco';
import {NgIcon} from '@ng-icons/core';

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
      <!-- i(bootstrapSave) -->
      <ng-icon [name]="icon()" size="20" />
      <!-- t(general.save) -->
      <span class="ms-2 text-lg">{{ text() ?? ('general.save' | transloco) }}</span>
    </button>
  `,
  selector: 'pu-save-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon, TranslocoPipe, MatFabButton, NgIcon],
})
export class SaveButton {
  valid = input(false);
  text = input<string>();
  form = input('form');
  type = input('submit');
  icon = input<string>('bootstrapSave');

  buttonClick = output();
}
