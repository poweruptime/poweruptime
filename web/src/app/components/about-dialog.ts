import {ChangeDetectionStrategy, Component, inject} from '@angular/core';

import {MatButton} from '@angular/material/button';
import {MatDialogActions, MatDialogClose, MatDialogContent} from '@angular/material/dialog';

import {TranslocoPipe} from '@jsverse/transloco';
import {MatButtonLoading} from '@ng-matero/extensions/button';

import {ChangelogStore, InfoStore} from '../services';
import {SupporterBadge} from './supporter-badge';

@Component({
  template: `
    <mat-dialog-content>
      <div class="flex items-center justify-between gap-4">
        <h2 class="text-3xl">{{ 'general.about' | transloco }} poweruptime</h2>
        <button
          [loading]="changelogStore.isPending()"
          (click)="changelogStore.load({version: undefined, newVersion: false})"
          type="button"
          mat-stroked-button>
          Changelog
        </button>
      </div>
      <div class="grid gap-4 py-4">
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

        @if (infoStore.support(); as support) {
          @if (support.supportsSince) {
            <div class="mt-7 mb-5 flex flex-col items-center gap-4">
              <pu-supporter-badge
                [hide]="!support.showSupportBadge"
                [supportsSince]="support.supportsSince" />
              <p>This server supports the development of poweruptime.</p>
            </div>
          } @else {
            <p>
              Please consider supporting the development of poweruptime.
              <br />
              <a href="https://github.com/sponsors/Dafnik" target="_blank" rel="noopener">
                <b>Dafnik's GitHub Sponsors Profile</b>
              </a>
            </p>
          }
        }
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button type="button" mat-button mat-dialog-close>{{ 'general.close' | transloco }}</button>
    </mat-dialog-actions>
  `,
  selector: 'pu-about-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogContent,
    MatDialogActions,
    MatButton,
    MatDialogClose,
    TranslocoPipe,
    MatButtonLoading,
    SupporterBadge,
  ],
})
export class AboutDialog {
  readonly infoStore = inject(InfoStore);
  readonly changelogStore = inject(ChangelogStore);

  constructor() {
    this.infoStore.loadSupport();
  }
}
