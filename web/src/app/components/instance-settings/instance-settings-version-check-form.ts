import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
} from '@angular/core';
import {outputFromObservable} from '@angular/core/rxjs-interop';
import {NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatAnchor, MatButton} from '@angular/material/button';
import {MatCard, MatCardContent, MatCardHeader} from '@angular/material/card';
import {MatProgressBar} from '@angular/material/progress-bar';
import {MatSlideToggle} from '@angular/material/slide-toggle';

import {distinctUntilChanged, map, skip} from 'rxjs';

import {TranslocoPipe} from '@jsverse/transloco';
import {BiComponent} from 'dfx-bootstrap-icons';

import {BackendType} from '@app/api';
import {Tag} from '@app/directives';
import {InstanceSettingsVersionCheckStore} from '@app/services';
import {JsonService} from '@app/services/json.service';

@Component({
  template: `
    @let currentVersion = jsonService.json()?.version;
    <mat-card appearance="outlined">
      <mat-card-header>
        <div class="flex w-full items-center justify-between gap-2">
          <h3 class="text-xl">
            {{ 'instanceSettings.versionCheck.title' | transloco }}
          </h3>
          <span pu-tag="GHOST">
            {{ currentVersion }}
          </span>
        </div>
      </mat-card-header>
      <mat-card-content>
        <div class="mb-8 mt-2 flex flex-col gap-2">
          @if (isLoading()) {
            <mat-progress-bar mode="indeterminate" />
          }
          <span class="text-gray-600 dark:text-gray-300">
            Check for application updates and manage notifications
          </span>
        </div>

        @let _versionCheckEnabled = versionCheckEnabled();
        <div class="relative rounded">
          <div
            class="transition-all duration-100"
            [class.filter]="!_versionCheckEnabled"
            [class.blur-lg]="!_versionCheckEnabled"
            [class.pointer-events-none]="!_versionCheckEnabled">
            <form class="flex min-h-60 flex-col gap-4" id="sponsorship-form" [formGroup]="form">
              <mat-slide-toggle
                formControlName="versionCheckAdminMailEnabled"
                labelPosition="before">
                {{ 'instanceSettings.versionCheck.adminMail' | transloco }}
              </mat-slide-toggle>

              @if (instanceSettingsVersionCheckStore.versionCheck()?.nextVersion; as nextVersion) {
                <div class="mt-6 inline-flex items-center gap-4">
                  <bi class="text-blue-500" name="download" />
                  <b>New version available</b>
                </div>
                <div class="inline-flex items-center gap-4">
                  <span pu-tag="GHOST">
                    {{ currentVersion }}
                  </span>
                  <bi name="arrow-right" />

                  <span pu-tag="BLUE">
                    {{ nextVersion }}
                  </span>
                </div>
                <a
                  mat-stroked-button
                  href="https://github.com/poweruptime/poweruptime/blob/main/changelogs/CHANGELOG.md"
                  target="_blank"
                  rel="noopener">
                  <bi name="box-arrow-up-right" />
                  View on GitHub
                </a>
                <div class="rounded-md bg-gray-200 p-3 dark:bg-gray-800">
                  <p class="text-muted-foreground mb-1 text-xs font-medium">Update via terminal:</p>
                  <code class="dark:bg-bg-dark rounded border bg-white px-2 py-1 font-mono text-xs">
                    ./pu update
                  </code>
                </div>
              }

              <div class="mt-auto flex items-center justify-end gap-4">
                <button
                  class="error-button"
                  (click)="form.controls.versionCheckEnabled.patchValue(false)"
                  type="button"
                  mat-flat-button>
                  <bi name="x-circle-fill" />
                  <span class="text-lg">{{ 'general.disable' | transloco }}</span>
                </button>
              </div>
            </form>
          </div>

          <!-- Centered Material button, only when lookup is disabled -->
          @if (!_versionCheckEnabled) {
            <div class="absolute inset-0 z-10 bg-transparent"></div>
            <div class="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 px-4">
              <div>
                <strong>{{ 'instanceSettings.versionCheck.warning.1' | transloco }}</strong>
                <div class="mt-4">
                  <i>{{ 'instanceSettings.versionCheck.warning.2' | transloco }}</i>
                </div>
                <ul class="list-disc">
                  <li>{{ 'instanceSettings.versionCheck.warning.3' | transloco }}</li>
                  <li>{{ 'instanceSettings.versionCheck.warning.4' | transloco }}</li>
                </ul>
              </div>
              <button
                (click)="form.controls.versionCheckEnabled.patchValue(true)"
                type="button"
                mat-flat-button>
                {{ 'general.enable' | transloco }}
              </button>
            </div>
          }

          <div class="mt-4 text-center"></div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    ::ng-deep mat-slide-toggle > .mdc-form-field.mdc-form-field--align-end {
      display: flex;
      justify-content: space-between;
    }

    ::ng-deep mat-slide-toggle > .mdc-form-field.mdc-form-field--align-end > .mdc-label {
      margin-left: 0 !important;
      width: 100%;
    }
  `,
  selector: 'pu-instance-settings-version-check-form',
  imports: [
    ReactiveFormsModule,
    MatSlideToggle,
    MatCard,
    MatCardContent,
    MatCardHeader,
    TranslocoPipe,
    MatButton,
    BiComponent,
    MatProgressBar,
    Tag,
    MatAnchor,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstanceSettingsVersionCheckForm {
  readonly instanceSettingsVersionCheckStore = inject(InstanceSettingsVersionCheckStore);
  readonly jsonService = inject(JsonService);

  form = inject(NonNullableFormBuilder).group({
    versionCheckEnabled: [false, [Validators.required]],
    versionCheckAdminMailEnabled: [false, [Validators.required]],
  });

  onSubmit = outputFromObservable(
    this.form.valueChanges.pipe(
      skip(1),
      map(() => this.form.getRawValue()),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
    ),
  );

  settings = input.required({
    transform: (it: BackendType['InstanceSettingsResponse']) => {
      this.form.patchValue(it);
      return it;
    },
  });

  isLoading = input(false, {transform: booleanAttribute});

  readonly versionCheckEnabled = computed(() => this.settings().versionCheckEnabled);

  constructor() {
    this.instanceSettingsVersionCheckStore.makeVersionCheck(this.versionCheckEnabled);
  }
}
