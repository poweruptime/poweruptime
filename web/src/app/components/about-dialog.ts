import {ChangeDetectionStrategy, Component} from '@angular/core';
import {MatButton} from '@angular/material/button';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';

import {TranslocoPipe} from '@jsverse/transloco';

import {environment} from '../../environments/environment';

@Component({
  template: `
    <h2 class="text-3xl" mat-dialog-title>{{ 'general.about' | transloco }} poweruptime</h2>
    <mat-dialog-content>
      <div class="grid gap-4">
        <p>
          Learn more on
          <a
            class="font-bold underline"
            href="https://github.com/poweruptime/poweruptime"
            target="_blank"
            rel="noopener">
            GitHub
          </a>
          .
        </p>
        <h3 class="text-xl">Version: {{ version }}</h3>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'general.close' | transloco }}</button>
    </mat-dialog-actions>
  `,
  selector: 'pu-about-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    MatDialogClose,
    TranslocoPipe,
  ],
})
export class AboutDialog {
  version = environment.version;
}
