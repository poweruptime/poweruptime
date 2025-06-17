import {httpResource} from '@angular/common/http';
import {ChangeDetectionStrategy, Component, computed, inject, resource} from '@angular/core';
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

import * as licensesJson from '../../assets/licenses.json';
import {environment} from '../../environments/environment';
import {ChangelogStore, JsonStore} from '../services';
import {BACKEND_API_URL} from '../util';

interface BackendEntry {
  project: {
    name: string;
    url: string;
  };
  version: string;
  license: {
    name: string;
    url: string;
  };
}

@Component({
  template: `
    <mat-dialog-content>
      <div class="flex items-center justify-between gap-4">
        <h2 class="text-3xl">{{ 'general.about' | transloco }} poweruptime</h2>
        <button
          [loading]="changelogStore.isPending()"
          (click)="changelogStore.load(undefined)"
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

        @if (jsonStore.json(); as json) {
          @if (json.supportsSince) {
            <p>
              This server supports the development of poweruptime.
              <br />
              Thank you ❤️
            </p>
          }
        }

        <h3 class="text-xl">Version: {{ version }}</h3>

        <h3 class="text-xl">Licenses ❤️</h3>

        <mat-accordion class="max-w-80" multi>
          <mat-expansion-panel>
            <mat-expansion-panel-header>
              <mat-panel-title>Web</mat-panel-title>
            </mat-expansion-panel-header>

            <div class="grid gap-4">
              @for (license of feLicenses(); track $index) {
                <a class="grid" [href]="license.link" rel="noreferrer" target="_blank">
                  <div class="w-100 flex justify-between">
                    <h6>{{ license.name }}</h6>
                    <small>{{ license.licenseType }}</small>
                  </div>
                  @if (license.author !== 'n/a') {
                    <small class="mb-1">by {{ license.author }}</small>
                  }
                  <small>{{ license.installedVersion }}</small>
                </a>
              }
            </div>
          </mat-expansion-panel>
          <mat-expansion-panel>
            <mat-expansion-panel-header>
              <mat-panel-title>Backend</mat-panel-title>
            </mat-expansion-panel-header>

            <div class="grid gap-4">
              @for (license of beLicenses(); track $index) {
                <a class="grid" [href]="license.project.url" rel="noreferrer" target="_blank">
                  <h6>{{ license.project.name }}</h6>
                  <small>{{ license.license.name }}</small>
                  <small>{{ license.version }}</small>
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
  ],
})
export class AboutDialog {
  readonly jsonStore = inject(JsonStore);
  readonly changelogStore = inject(ChangelogStore);

  version = environment.version;

  feLicenses$ = httpResource<typeof licensesJson>(() => '/assets/licenses.json');

  feLicenses = computed(
    () =>
      this.feLicenses$.value()?.map((it) => {
        it.link = it.link.replace('git+', '');
        it.link = it.link.replace('git:', 'https:');
        it.link = it.link.replace('ssh://git@', 'https:');
        return it;
      }) ?? [],
  );

  baLicenses$ = resource({
    loader: () =>
      fetch(`${BACKEND_API_URL}/v1/public/static-files/backend.xml`).then((res) => res.text()),
  });

  beLicenses = computed(() => {
    const xmlString = this.baLicenses$.value();

    if (!xmlString) {
      return [];
    }

    const doc = new DOMParser().parseFromString(xmlString, 'application/xml');
    const rows = Array.from(doc.querySelectorAll('table > tr'));

    // drop header row
    return rows.slice(1).map((tr) => {
      const [projTd, verTd, licTd] = Array.from(tr.querySelectorAll('td'));
      const aProj = projTd.querySelector('a');
      const aLic = licTd.querySelector('a');

      return {
        project: {
          name: aProj?.textContent?.trim() ?? 'Unknown',
          url: aProj?.getAttribute('href') ?? 'Unknown',
        },
        version: verTd.textContent?.trim() ?? 'Unknown',
        license: {
          name: aLic?.textContent?.trim() ?? licTd.textContent?.trim() ?? 'Unknown',
          url: aLic?.getAttribute('href') ?? 'Unknown',
        },
      } satisfies BackendEntry;
    });
  });
}
