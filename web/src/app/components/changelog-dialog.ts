import {ChangeDetectionStrategy, Component, inject} from '@angular/core';

import {MatButton} from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
} from '@angular/material/dialog';

import {TranslocoPipe} from '@jsverse/transloco';

@Component({
  template: `
    <mat-dialog-content>
      <div class="prose dark:prose-invert" [innerHTML]="data.changelog"></div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button type="button" mat-button mat-dialog-close>{{ 'general.close' | transloco }}</button>
    </mat-dialog-actions>
  `,
  styles: ``,
  selector: 'pu-changelog-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogContent, MatDialogActions, MatButton, MatDialogClose, TranslocoPipe],
})
export class ChangelogDialog {
  data = inject(MAT_DIALOG_DATA) as {changelog: string};
}
