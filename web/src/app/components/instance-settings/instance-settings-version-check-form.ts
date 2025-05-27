import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatAnchor, MatButton} from '@angular/material/button';
import {MatCard, MatCardContent, MatCardHeader} from '@angular/material/card';
import {MatChipGrid, MatChipInput, MatChipRemove, MatChipRow} from '@angular/material/chips';
import {MatError, MatFormField, MatLabel} from '@angular/material/form-field';
import {MatSlideToggle} from '@angular/material/slide-toggle';
import {MatTooltip} from '@angular/material/tooltip';

import {startWith} from 'rxjs';

import {TranslocoPipe} from '@jsverse/transloco';
import {BiComponent} from 'dfx-bootstrap-icons';

import {BackendType, Database} from '@app/api';
import {Tag} from '@app/directives';
import {InstanceSettingsVersionCheckStore, JsonStore} from '@app/services';
import {chipInputAdd, chipInputRemove} from '@app/util';

import {SaveButton, arrayItemMaxLength, arrayItemMinLength, injectIsValid} from '../../form';
import {CopyIconButton} from '../copy-icon-button';
import {TableLoadingBar} from '../table-loading-bar';

@Component({
  template: `
    @let currentVersion = jsonStore.json()?.version;
    <mat-card appearance="outlined">
      <mat-card-header>
        <div class="flex w-full items-center justify-between gap-2">
          <h3 class="text-xl">
            {{ 'instanceSettings.versionCheck.title' | transloco }}
          </h3>
          <span
            [matTooltip]="'instanceSettings.versionCheck.currentVersion' | transloco"
            pu-tag="GHOST">
            {{ currentVersion }}
          </span>
        </div>
      </mat-card-header>
      <mat-card-content>
        <div class="mb-8 flex flex-col gap-2">
          <pu-table-loading-bar [loading]="isLoading()" />
          <span class="text-gray-600 dark:text-gray-300">
            Check for application updates and manage notifications
          </span>
        </div>

        @let _versionCheckEnabled = versionCheckEnabled();
        <div class="relative rounded">
          <div
            class="grid min-h-60 gap-8 transition-all duration-100"
            [class.blur-lg]="!_versionCheckEnabled"
            [class.pointer-events-none]="!_versionCheckEnabled"
            [class.saturate-50]="!_versionCheckEnabled">
            @if (
              instanceSettingsVersionCheckStore.versionCheck()?.latestVersion;
              as latestVersion
            ) {
              <div class="grid gap-3">
                <div class="inline-flex items-center gap-4">
                  <bi class="text-blue-500" name="download" />
                  <b>New version available</b>
                </div>
                <div class="inline-flex items-center gap-4">
                  <span pu-tag="GHOST">
                    {{ currentVersion }}
                  </span>
                  <bi name="arrow-right" />

                  <span pu-tag="BLUE">
                    {{ latestVersion }}
                  </span>
                </div>
                @let link =
                  latestVersion.includes('beta')
                    ? 'https://github.com/poweruptime/poweruptime/blob/main/changelogs/CHANGELOG-beta.md'
                    : 'https://github.com/poweruptime/poweruptime/blob/main/changelogs/CHANGELOG.md';
                <a [href]="link" mat-stroked-button target="_blank" rel="noopener">
                  <bi name="box-arrow-up-right" />
                  View on GitHub
                </a>
                <div class="rounded-md bg-gray-200 p-3 dark:bg-gray-800">
                  <p class="text-muted-foreground mb-1 text-xs font-medium">Update via terminal:</p>
                  <div
                    class="dark:bg-bg-dark inline-flex items-center gap-2 rounded border bg-white px-2">
                    <code class="font-mono text-xs" style="padding-top: 0.124rem">./pu update</code>

                    <pu-copy-icon-button [content]="'./pu update'" />
                  </div>
                </div>
              </div>
            } @else {
              <div
                class="inline-flex items-center gap-2 font-medium text-green-600 dark:text-green-400">
                <bi name="check2-circle" />
                <span>You're running the latest version</span>
              </div>
              <button
                (click)="
                  instanceSettingsVersionCheckStore.makeVersionCheck({
                    versionCheckEnabled: true,
                    skipCache: true,
                  })
                "
                type="button"
                mat-stroked-button>
                <bi name="arrow-clockwise" />
                Check for updates
              </button>
            }

            <hr />

            <form
              class="grid gap-2"
              id="version-check-form"
              [formGroup]="form"
              (ngSubmit)="onSubmit()">
              <mat-slide-toggle
                formControlName="versionCheckAdminMailEnabled"
                labelPosition="before">
                {{ 'instanceSettings.versionCheck.adminMail.title' | transloco }}
              </mat-slide-toggle>

              @if (form.controls.versionCheckAdminMailEnabled.getRawValue()) {
                <div class="motion-preset-slide-down motion-duration-300 grid gap-2">
                  <mat-slide-toggle
                    formControlName="versionCheckAdminMailSendToEveryone"
                    labelPosition="before">
                    {{ 'instanceSettings.versionCheck.adminMail.everyone' | transloco }}
                  </mat-slide-toggle>
                  <mat-form-field>
                    <mat-label>
                      {{ 'instanceSettings.versionCheck.adminMail.to.label' | transloco }}
                    </mat-label>
                    <mat-chip-grid
                      #toGrid
                      [attr.aria-label]="
                        'instanceSettings.versionCheck.adminMail.to.enter' | transloco
                      "
                      formControlName="versionCheckAdminMailTo">
                      @for (
                        email of form.controls.versionCheckAdminMailTo.getRawValue();
                        track email
                      ) {
                        <mat-chip-row
                          (removed)="chipInputRemove(form.controls.versionCheckAdminMailTo, email)">
                          {{ email }}
                          <button
                            [attr.aria-label]="
                              'instanceSettings.versionCheck.adminMailTo.remove'
                                | transloco: {email}
                            "
                            type="button"
                            matChipRemove>
                            <bi name="x-circle" aria-hidden="true" />
                          </button>
                        </mat-chip-row>
                      }
                    </mat-chip-grid>
                    <input
                      [matChipInputFor]="toGrid"
                      [placeholder]="'instanceSettings.versionCheck.adminMail.to.new' | transloco"
                      (matChipInputTokenEnd)="
                        chipInputAdd(form.controls.versionCheckAdminMailTo, $event)
                      " />

                    @let toErrors = form.controls.versionCheckAdminMailTo.errors;
                    @if (toErrors?.['required']) {
                      <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
                    }
                    @if (toErrors?.['minLengthArrayItem']; as minlength) {
                      <mat-error>
                        {{ 'form.validation.minlength' | transloco: minlength }}
                      </mat-error>
                    }
                    @if (toErrors?.['maxLengthArrayItem']; as maxlength) {
                      <mat-error>
                        {{ 'form.validation.maxlength' | transloco: maxlength }}
                      </mat-error>
                    }
                  </mat-form-field>
                </div>
              }
            </form>
            <div class="mt-auto flex items-center justify-between gap-4">
              <pu-save-button [valid]="isValid()" form="version-check-form" />

              <button
                class="error-button"
                (click)="
                  form.patchValue({
                    versionCheckEnabled: false,
                    versionCheckAdminMailSendToEveryone: true,
                  });
                  onSubmit()
                "
                type="button"
                mat-flat-button>
                <bi name="x-circle-fill" />
                <span class="text-lg">{{ 'general.disable' | transloco }}</span>
              </button>
            </div>
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
                (click)="form.controls.versionCheckEnabled.patchValue(true); onSubmit()"
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
    MatChipGrid,
    MatChipRow,
    MatChipRemove,
    MatFormField,
    MatLabel,
    MatError,
    MatLabel,
    MatButton,
    MatAnchor,
    TranslocoPipe,
    BiComponent,
    Tag,
    CopyIconButton,
    TableLoadingBar,
    MatChipInput,
    MatTooltip,
    SaveButton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstanceSettingsVersionCheckForm {
  readonly instanceSettingsVersionCheckStore = inject(InstanceSettingsVersionCheckStore);
  readonly jsonStore = inject(JsonStore);

  protected readonly chipInputAdd = chipInputAdd;
  protected readonly chipInputRemove = chipInputRemove;

  form = inject(NonNullableFormBuilder).group({
    versionCheckEnabled: [false, [Validators.required]],
    versionCheckAdminMailEnabled: [false, [Validators.required]],
    versionCheckAdminMailSendToEveryone: [true, [Validators.required]],
    versionCheckAdminMailTo: new FormControl<string[] | null>(null, [
      Validators.min(Database.MIN_VERSION_CHECK_ADMIN_MAILS),
      Validators.max(Database.MAX_VERSION_CHECK_ADMIN_MAILS),
      arrayItemMinLength(Database.MIN_MAIL_LENGTH),
      arrayItemMaxLength(Database.MAX_MAIL_LENGTH),
    ]),
  });

  readonly isValid = injectIsValid(this.form);

  submitSettings = output<BackendType['InstanceSettingVersionCheckDto']>();

  onSubmit() {
    const it = this.form.getRawValue();
    this.submitSettings.emit({
      ...it,
      versionCheckAdminMailTo: it.versionCheckAdminMailSendToEveryone
        ? undefined
        : (it.versionCheckAdminMailTo ?? undefined),
    });
  }

  settings = input.required({
    transform: (it: BackendType['InstanceSettingsResponse']) => {
      this.form.patchValue({
        ...it,
        versionCheckAdminMailSendToEveryone: !it.versionCheckAdminMailTo,
      });
      return it;
    },
  });

  isLoading = input(false, {transform: booleanAttribute});

  readonly versionCheckEnabled = computed(() => this.settings().versionCheckEnabled);

  constructor() {
    this.instanceSettingsVersionCheckStore.makeVersionCheck(
      computed(() => ({
        versionCheckEnabled: this.versionCheckEnabled(),
      })),
    );

    this.form.controls.versionCheckAdminMailSendToEveryone.valueChanges
      .pipe(
        takeUntilDestroyed(),
        startWith(this.form.controls.versionCheckAdminMailSendToEveryone.getRawValue()),
      )
      .subscribe((versionCheckAdminMailSendToEveryone) => {
        if (versionCheckAdminMailSendToEveryone) {
          this.form.controls.versionCheckAdminMailTo.removeValidators(Validators.required);
          this.form.controls.versionCheckAdminMailTo.disable();
          return;
        }
        this.form.controls.versionCheckAdminMailTo.addValidators(Validators.required);
        this.form.controls.versionCheckAdminMailTo.enable();
      });
  }
}
