import {httpResource} from '@angular/common/http';
import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';

import {MatButton} from '@angular/material/button';
import {MatRipple} from '@angular/material/core';
import {
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
} from '@angular/material/dialog';
import {
  MatAccordion,
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle,
} from '@angular/material/expansion';
import {MatDivider, MatList, MatListItem, MatListItemTitle} from '@angular/material/list';

import {TranslocoPipe} from '@jsverse/transloco';

import {environment} from '@app/util';

import {IsSystemAdmin} from '../directives';
import {BACKEND_API_URL} from '../util';
import {DebugInfoDialog} from './debug-info-dialog';

interface Dependency {
  moduleName: string;
  moduleUrl: string;
  moduleVersion: string;
  moduleLicense: string;
  moduleLicenseUrl?: string;
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
      <h2 class="text-3xl">{{ 'general.help' | transloco }}</h2>
      <div class="grid gap-4">
        <div></div>
        <mat-list role="list">
          <a
            class="hover:cursor-pointer!"
            mat-list-item
            href="https://github.com/poweruptime/poweruptime/discussions/categories/feature-requests-ideas"
            target="_blank"
            rel="noopener"
            matRipple>
            Feedback
          </a>
          <a
            class="hover:cursor-pointer!"
            mat-list-item
            href="https://github.com/poweruptime/poweruptime/discussions"
            target="_blank"
            rel="noopener"
            matRipple>
            Forum
          </a>
          <mat-divider></mat-divider>

          <mat-list-item>
            <span matListItemTitle>Version</span>
            <span class="text-sm">{{ version }}</span>
          </mat-list-item>
          <button
            class="hover:cursor-pointer!"
            *isSystemAdmin
            (click)="openDebugInfoDialog()"
            type="button"
            style="text-align: start"
            mat-list-item
            matRipple>
            Debug information
          </button>
        </mat-list>

        <h3 class="text-xl">Licenses ❤️</h3>

        <mat-accordion multi>
          <mat-expansion-panel>
            <mat-expansion-panel-header>
              <mat-panel-title>Web</mat-panel-title>
            </mat-expansion-panel-header>

            <div class="grid gap-4">
              @for (license of feLicenses(); track $index) {
                <a class="grid gap-2" [href]="license.moduleUrl" rel="noreferrer" target="_blank">
                  <div class="flex justify-between gap-2">
                    <h6>{{ license.moduleName }}</h6>
                    <small>{{ license.moduleVersion }}</small>
                  </div>

                  <a [href]="license.moduleLicenseUrl" target="_blank" rel="noreferrer">
                    <small>{{ license.moduleLicense }}</small>
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
                <a class="grid gap-2" [href]="license.moduleUrl" rel="noreferrer" target="_blank">
                  <div class="flex justify-between gap-2">
                    <h6>{{ license.moduleName }}</h6>
                    <small>{{ license.moduleVersion }}</small>
                  </div>

                  @if (license.moduleLicenseUrl; as url) {
                    <a [href]="url" target="_blank" rel="noreferrer">
                      <small>{{ license.moduleLicense }}</small>
                    </a>
                  } @else {
                    <small>{{ license.moduleLicense }}</small>
                  }
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
  selector: 'pu-help-dialog',
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
    MatListItem,
    MatList,
    MatListItemTitle,
    MatRipple,
    MatDivider,
    IsSystemAdmin,
  ],
})
export class HelpDialog {
  private readonly dialog = inject(MatDialog);

  version = environment.version;

  licenses = httpResource<LicenseData>(
    () => `${BACKEND_API_URL}/v1/public/static-files/licenses.json`,
  );

  feLicenses = computed(() => this.licenses.value()?.importedModules?.[0]?.dependencies ?? []);

  openDebugInfoDialog() {
    this.dialog.open(DebugInfoDialog, {
      width: '600px',
    });
  }
}
