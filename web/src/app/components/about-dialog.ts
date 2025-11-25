import {httpResource} from '@angular/common/http';
import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';

import {MatButton} from '@angular/material/button';
import {MatDialogActions, MatDialogClose, MatDialogContent} from '@angular/material/dialog';
import {
  MatAccordion,
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle,
} from '@angular/material/expansion';

import {TranslocoPipe} from '@jsverse/transloco';
import {MatButtonLoading} from '@ng-matero/extensions/button';

import {environment} from '@app/util';

import {ChangelogStore, InfoStore} from '../services';
import {BACKEND_API_URL} from '../util';
import {SupporterBadge} from './supporter-badge';

interface Dependency {
  moduleName: string;
  moduleUrl: string;
  moduleVersion: string;
  moduleLicense: string;
  moduleLicenseUrl: string;
}

interface ImportedModule {
  moduleName: string;
  dependencies: Dependency[];
}

interface LicenseData {
  dependencies: Dependency[];
  importedModules: ImportedModule[];
}

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
                Dafnik's GitHub Sponsors Profile
              </a>
            </p>
          }
        }

        <h3 class="text-xl">Version: {{ version }}</h3>

        <h3 class="text-xl">Licenses ❤️</h3>

        <mat-accordion multi>
          <mat-expansion-panel>
            <mat-expansion-panel-header>
              <mat-panel-title>Web</mat-panel-title>
            </mat-expansion-panel-header>

            <div class="grid gap-4">
              @for (license of feLicenses(); track $index) {
                <a
                  class="flex flex-col gap-2"
                  [href]="license.moduleUrl"
                  rel="noreferrer"
                  target="_blank">
                  <h6>{{ license.moduleName }}</h6>
                  <small>{{ license.moduleLicense }}</small>

                  <a [href]="license.moduleLicenseUrl" target="_blank" rel="noreferrer">
                    <small>{{ license.moduleVersion }}</small>
                  </a>
                </a>
              }
            </div>
          </mat-expansion-panel>
          <mat-expansion-panel>
            <mat-expansion-panel-header>
              <mat-panel-title>Backend</mat-panel-title>
            </mat-expansion-panel-header>

            <div class="grid gap-4">
              @for (license of licenses.value()?.dependencies ?? []; track $index) {
                <a
                  class="flex flex-col gap-2"
                  [href]="license.moduleUrl"
                  rel="noreferrer"
                  target="_blank">
                  <h6>{{ license.moduleName }}</h6>
                  <small>{{ license.moduleLicense }}</small>

                  <a [href]="license.moduleLicenseUrl" target="_blank" rel="noreferrer">
                    <small>{{ license.moduleVersion }}</small>
                  </a>
                </a>
              }
            </div>
          </mat-expansion-panel>
        </mat-accordion>
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
    MatExpansionPanelTitle,
    MatExpansionPanelHeader,
    MatExpansionPanel,
    MatAccordion,
    MatButtonLoading,
    SupporterBadge,
  ],
})
export class AboutDialog {
  readonly infoStore = inject(InfoStore);
  readonly changelogStore = inject(ChangelogStore);

  version = environment.version;

  licenses = httpResource<LicenseData>(
    () => `${BACKEND_API_URL}/v1/public/static-files/licenses.json`,
  );

  feLicenses = computed(() => this.licenses.value()?.importedModules?.[0]?.dependencies ?? []);

  constructor() {
    this.infoStore.loadSupport();
  }
}
