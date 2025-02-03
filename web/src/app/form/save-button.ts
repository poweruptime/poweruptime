import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {MatButton, MatFabButton} from '@angular/material/button';

import {TranslocoPipe} from '@jsverse/transloco';
import {BiComponent, provideBi, withSize} from 'dfx-bootstrap-icons';

@Component({
  template: `
    <div class="flex content-end">
      <button
        class="flex items-center"
        [disabled]="!valid()"
        mat-fab
        extended
        type="submit"
        form="form">
        <bi name="save" />
        <span class="ms-2 text-lg">{{ text() ?? 'general.save' | transloco }}</span>
      </button>
    </div>
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
}
