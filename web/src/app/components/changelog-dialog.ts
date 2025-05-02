import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {MatButton} from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
} from '@angular/material/dialog';

import {TranslocoPipe} from '@jsverse/transloco';
import {MarkdownComponent} from 'ngx-markdown';

@Component({
  template: `
    <mat-dialog-content>
      <markdown class="prose dark:prose-invert" [data]="data.changelog" emoji />
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'general.close' | transloco }}</button>
    </mat-dialog-actions>
  `,
  styles: ``,
  selector: 'pu-changelog-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogContent,
    MatDialogActions,
    MatButton,
    MatDialogClose,
    TranslocoPipe,
    MarkdownComponent,
  ],
})
export class ChangelogDialog {
  data = inject(MAT_DIALOG_DATA) as {changelog: string};
}
