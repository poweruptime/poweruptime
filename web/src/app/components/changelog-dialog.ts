import {ChangeDetectionStrategy, Component, inject} from '@angular/core';

import {MatButton} from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
} from '@angular/material/dialog';

import {TranslocoPipe} from '@jsverse/transloco';

import {ChangelogStore} from '../services';

@Component({
  template: `
    <mat-dialog-content>
      <div class="prose dark:prose-invert" [innerHTML]="data.changelog"></div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button
        (click)="changelogStore.showDialogOnNewVersion.set(false); dialogRef.close()"
        type="button"
        mat-button>
        {{ 'changelog.closeAndDontShowAgain' | transloco }}
      </button>
      <button type="button" mat-flat-button mat-dialog-close>
        {{ 'general.close' | transloco }}
      </button>
    </mat-dialog-actions>
  `,
  selector: 'pu-changelog-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogContent, MatDialogActions, MatButton, MatDialogClose, TranslocoPipe],
})
export class ChangelogDialog {
  dialogRef = inject(MatDialogRef);
  changelogStore = inject(ChangelogStore);

  data = inject(MAT_DIALOG_DATA) as {changelog: string; newVersion: boolean};
}
