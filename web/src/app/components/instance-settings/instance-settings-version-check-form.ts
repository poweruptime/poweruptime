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

import {MatButton} from '@angular/material/button';
import {MatChipGrid, MatChipInput, MatChipRemove, MatChipRow} from '@angular/material/chips';
import {MatError, MatFormField, MatLabel} from '@angular/material/form-field';
import {MatSlideToggle} from '@angular/material/slide-toggle';

import {startWith} from 'rxjs';

import {TranslocoPipe} from '@jsverse/transloco';
import {BrnTooltipContentTemplate} from '@spartan-ng/brain/tooltip';
import {HlmBadgeImports} from '@spartan-ng/helm/badge';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmCardImports} from '@spartan-ng/helm/card';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmTooltipImports} from '@spartan-ng/helm/tooltip';

import {BackendType, Database} from '@app/api';
import {InfoStore, InstanceSettingsVersionCheckStore} from '@app/services';
import {chipInputAdd, chipInputRemove} from '@app/util';

import {SaveButton, arrayItemMaxLength, arrayItemMinLength, injectIsValid} from '../../form';
import {CopyIconButton} from '../copy-icon-button';
import {TableLoadingBar} from '../table-loading-bar';

@Component({
  template: `
    @let currentVersion = infoStore.version();

    <section hlmCard>
      <div hlmCardHeader>
        <div class="flex items-center justify-between">
          <div class="flex flex-col gap-2">
            <h3 hlmCardTitle>{{ 'instanceSettings.versionCheck.title' | transloco }}</h3>
            <p hlmCardDescription>Check for application updates and manage notifications</p>
          </div>
          <hlm-tooltip>
            <span
              class="bg-secondary text-secondary-foreground rounded px-2 py-1 text-lg font-semibold"
              hlmTooltipTrigger>
              {{ currentVersion }}
            </span>
            <span *brnTooltipContent>
              {{ 'instanceSettings.versionCheck.currentVersion' | transloco }}
            </span>
          </hlm-tooltip>
        </div>

        <pu-table-loading-bar [loading]="isLoading()" />
      </div>
      @let _versionCheckEnabled = versionCheckEnabled();
      <div class="relative">
        <div
          class="flex h-full min-h-64 flex-col justify-between gap-4 transition-all duration-100"
          [class.blur-lg]="!_versionCheckEnabled"
          [class.pointer-events-none]="!_versionCheckEnabled"
          [class.saturate-50]="!_versionCheckEnabled">
          <div class="space-y-4" hlmCardContent>
            @if (instanceSettingsVersionCheckStore.versionCheck()?.version; as latestVersion) {
              <section hlmCard>
                <div class="flex items-center gap-2" hlmCardHeader>
                  <div class="h-2 w-2 animate-pulse rounded-full bg-blue-500"></div>
                  <h4 class="text-sm font-medium" hlmCardTitle>New version available</h4>
                </div>
                <div class="space-y-4" hlmCardContent>
                  <div class="flex items-center gap-3">
                    <span class="font-mono" hlmBadge variant="outline">
                      {{ currentVersion }}
                    </span>
                    <ng-icon hlm name="bootstrapArrowRight" size="sm" />
                    <span
                      class="bg-blue-500 font-mono text-white dark:bg-blue-600"
                      variant="secondary"
                      hlmBadge>
                      {{ latestVersion }}
                    </span>
                  </div>
                  <div class="grid grid-cols-2 gap-2">
                    <button
                      (click)="
                        instanceSettingsVersionCheckStore.makeVersionCheck({
                          versionCheckEnabled: true,
                          skipCache: true,
                        })
                      "
                      hlmBtn
                      variant="outline"
                      type="button">
                      <ng-icon hlm size="sm" name="bootstrapArrowClockwise" />
                      Check for Updates
                    </button>

                    @let link =
                      latestVersion.includes('beta')
                        ? 'https://github.com/poweruptime/poweruptime/blob/main/changelogs/CHANGELOG-beta.md'
                        : 'https://github.com/poweruptime/poweruptime/blob/main/changelogs/CHANGELOG.md';
                    <a [href]="link" hlmBtn variant="outline" target="_blank" rel="noopener">
                      View on GitHub
                      <ng-icon hlm size="sm" name="bootstrapBoxArrowUpRight" />
                    </a>
                  </div>
                </div>
              </section>

              <div class="space-y-2">
                <span class="text-muted-foreground text-xs tracking-wide uppercase">
                  Update via terminal
                </span>
                <div class="group relative">
                  <div
                    class="bg-secondary/50 border-border/50 flex items-center justify-between rounded-md border px-4 py-3 font-mono text-sm">
                    <code class="text-foreground">./pu update</code>
                    <pu-copy-icon-button [content]="'./pu update'" />
                  </div>
                </div>
              </div>
            } @else {
              <div class="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-500">
                <ng-icon hlm name="bootstrapCheck2Circle" />
                <span class="font-medium">You're running the latest version</span>
              </div>

              <button
                (click)="
                  instanceSettingsVersionCheckStore.makeVersionCheck({
                    versionCheckEnabled: true,
                    skipCache: true,
                  })
                "
                hlmBtn
                variant="outline"
                type="button">
                <ng-icon hlm size="sm" name="bootstrapArrowClockwise" />
                Check for Updates
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
                              'instanceSettings.versionCheck.adminMail.to.remove'
                                | transloco: {email}
                            "
                            type="button"
                            matChipRemove>
                            <ng-icon name="bootstrapXCircle" aria-hidden="true" />
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
          </div>
          <div class="flex flex-col justify-between gap-2 sm:flex-row" hlmCardFooter>
            <pu-save-button [valid]="isValid()" form="version-check-form" />

            <button
              (click)="
                form.patchValue({
                  versionCheckEnabled: false,
                  versionCheckAdminMailSendToEveryone: true,
                });
                onSubmit()
              "
              type="button"
              hlmBtn
              variant="outline">
              <ng-icon hlm size="sm" name="bootstrapXCircleFill" />
              <span class="text-lg">{{ 'general.disable' | transloco }}</span>
            </button>
          </div>
        </div>

        <!-- Centered Material button, only when lookup is disabled -->
        @if (!_versionCheckEnabled) {
          <div class="absolute inset-0 z-10 bg-transparent"></div>
          <div class="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 px-20">
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
      </div>
    </section>
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
    MatChipGrid,
    MatChipRow,
    MatChipRemove,
    MatFormField,
    MatLabel,
    MatError,
    MatLabel,
    MatButton,
    MatChipInput,
    TranslocoPipe,
    CopyIconButton,
    TableLoadingBar,
    SaveButton,
    HlmCardImports,
    HlmButtonImports,
    HlmTooltipImports,
    HlmIconImports,
    HlmBadgeImports,
    BrnTooltipContentTemplate,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstanceSettingsVersionCheckForm {
  readonly instanceSettingsVersionCheckStore = inject(InstanceSettingsVersionCheckStore);
  readonly infoStore = inject(InfoStore);

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
    this.infoStore.loadVersion();

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
