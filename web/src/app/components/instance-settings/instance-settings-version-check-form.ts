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

import {startWith} from 'rxjs';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmBadgeImports} from '@spartan-ng/helm/badge';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmCardImports} from '@spartan-ng/helm/card';
import {HlmFieldImports} from '@spartan-ng/helm/field';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmInputGroupImports} from '@spartan-ng/helm/input-group';
import {HlmLabelImports} from '@spartan-ng/helm/label';
import {HlmSwitchImports} from '@spartan-ng/helm/switch';
import {HlmTooltipImports} from '@spartan-ng/helm/tooltip';

import {BackendType, Database} from '@app/api';
import {SaveButton, arrayItemMaxLength, arrayItemMinLength, injectIsValid} from '@app/form';
import {InfoStore, InstanceSettingsVersionCheckStore} from '@app/services';
import {chipInputAdd, chipInputRemove} from '@app/util';

import {TableLoadingBar} from '../table-loading-bar';
import {VersionCheckDisabled} from './version-check-disabled';
import {VersionCheckInfo} from './version-check-info';

@Component({
  template: `
    @let currentVersion = infoStore.version();

    <section hlmCard>
      <div hlmCardHeader>
        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <h3 hlmCardTitle>{{ 'instanceSettings.versionCheck.title' | transloco }}</h3>
            <span
              class="bg-secondary text-secondary-foreground rounded px-2 py-1 text-lg font-semibold"
              [hlmTooltip]="'instanceSettings.versionCheck.currentVersion' | transloco">
              {{ currentVersion }}
            </span>
          </div>
          <p hlmCardDescription>Check for application updates and manage notifications</p>
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
          <div class="flex flex-col gap-4" hlmCardContent>
            <pu-version-check-info />

            <hr />

            <form id="version-check-form" [formGroup]="form" (ngSubmit)="onSubmit()">
              <div
                class="border-input data-[checked=true]:border-primary/50 relative grid gap-4 rounded-md border p-4 shadow-xs outline-none"
                [attr.data-checked]="form.controls.versionCheckAdminMailEnabled.value">
                <label
                  class="flex items-start justify-between gap-2 has-data-[disabled=true]:cursor-not-allowed has-data-[disabled=true]:opacity-70"
                  for="versionCheckAdminMailEnabled"
                  hlmLabel>
                  <div class="inline-flex items-center gap-2">
                    <div class="bg-secondary flex h-9 w-9 items-center justify-center rounded-md">
                      <ng-icon hlm size="sm" name="lucideRefreshCcw" />
                    </div>
                    <div class="flex flex-col gap-2">
                      <span class="text-sm leading-4">
                        {{ 'instanceSettings.versionCheck.adminMail.title' | transloco }}
                      </span>
                      <p class="text-muted-foreground text-xs font-normal">
                        Send email when an update is available.
                      </p>
                    </div>
                  </div>
                  <hlm-switch
                    inputId="versionCheckAdminMailEnabled"
                    formControlName="versionCheckAdminMailEnabled" />
                </label>

                @if (form.controls.versionCheckAdminMailEnabled.getRawValue()) {
                  <div
                    class="flex flex-col gap-2 duration-300"
                    animate.enter="animate-in fade-in slide-in-from-top-20"
                    animate.leave="animate-out fade-out slide-out-to-top-20">
                    <label
                      class="flex items-center justify-between"
                      hlmLabel
                      for="versionCheckAdminMailSendToEveryone">
                      {{ 'instanceSettings.versionCheck.adminMail.everyone' | transloco }}
                      <hlm-switch
                        inputId="versionCheckAdminMailSendToEveryone"
                        formControlName="versionCheckAdminMailSendToEveryone" />
                    </label>

                    @if (!form.controls.versionCheckAdminMailSendToEveryone.getRawValue()) {
                      <div class="col-span-8 grid gap-2 xl:col-span-5">
                        <div class="flex items-end gap-2">
                          <form
                            class="space-y-2"
                            id="mailToForm"
                            [formGroup]="mailToForm"
                            (ngSubmit)="
                              chipInputAdd(
                                form.controls.versionCheckAdminMailTo,
                                mailToForm.controls.to
                              )
                            ">
                            <hlm-field>
                              <label for="to" hlmLabel>
                                {{ 'instanceSettings.versionCheck.adminMail.to.label' | transloco }}
                              </label>
                              <div hlmInputGroup>
                                <input
                                  id="to"
                                  hlmInputGroupInput
                                  formControlName="to"
                                  type="email"
                                  placeholder="you@example.com" />
                                <div hlmInputGroupAddon>
                                  <ng-icon name="lucideMail" />
                                </div>
                              </div>
                            </hlm-field>
                          </form>
                          <button
                            [disabled]="mailToForm.invalid"
                            [hlmTooltip]="
                              'instanceSettings.versionCheck.adminMail.to.enter' | transloco
                            "
                            hlmBtn
                            hlmTooltipTrigger
                            variant="outline"
                            form="mailToForm"
                            type="submit">
                            <ng-icon hlm name="lucideCirclePlus" size="sm" />
                          </button>
                        </div>

                        <div class="flex flex-wrap gap-2">
                          @for (
                            email of form.controls.versionCheckAdminMailTo.getRawValue();
                            track email
                          ) {
                            <span hlmBadge variant="secondary">
                              <div class="flex items-center justify-center gap-1">
                                <span>{{ email }}</span>
                                <button
                                  [attr.aria-label]="
                                    'instanceSettings.versionCheck.adminMail.to.remove'
                                      | transloco: {email: email}
                                  "
                                  (click)="
                                    chipInputRemove(form.controls.versionCheckAdminMailTo, email)
                                  "
                                  hlmBtn
                                  variant="ghost"
                                  size="icon-xs"
                                  type="button">
                                  <ng-icon hlm name="lucideX" size="xs" />
                                </button>
                              </div>
                            </span>
                          }
                        </div>
                        @let toErrors = form.controls.versionCheckAdminMailTo.errors;
                        @if (toErrors?.['required']) {
                          <hlm-field-error>
                            {{ 'form.validation.required' | transloco }}
                          </hlm-field-error>
                        }
                        @if (toErrors?.['minLengthArrayItem']; as minlength) {
                          <hlm-field-error>
                            {{ 'form.validation.minlength' | transloco: minlength }}
                          </hlm-field-error>
                        }
                        @if (toErrors?.['maxLengthArrayItem']; as maxlength) {
                          <hlm-field-error>
                            {{ 'form.validation.maxlength' | transloco: maxlength }}
                          </hlm-field-error>
                        }
                      </div>
                    }
                  </div>
                }
              </div>
            </form>
          </div>
          <div class="flex flex-row justify-between gap-2" hlmCardFooter>
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

        @if (!_versionCheckEnabled) {
          <pu-version-check-disabled
            (enableVersionCheck)="form.controls.versionCheckEnabled.patchValue(true); onSubmit()" />
        }
      </div>
    </section>
  `,
  selector: 'pu-instance-settings-version-check-form',
  imports: [
    VersionCheckInfo,
    VersionCheckDisabled,
    TableLoadingBar,
    SaveButton,
    ReactiveFormsModule,
    TranslocoPipe,
    HlmCardImports,
    HlmButtonImports,
    HlmTooltipImports,
    HlmIconImports,
    HlmBadgeImports,
    HlmLabelImports,
    HlmSwitchImports,
    HlmInputGroupImports,
    HlmFieldImports,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstanceSettingsVersionCheckForm {
  protected readonly chipInputAdd = chipInputAdd;
  protected readonly chipInputRemove = chipInputRemove;

  protected readonly infoStore = inject(InfoStore);

  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly form = this.fb.group({
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

  protected readonly mailToForm = this.fb.group({
    to: [
      '',
      [
        Validators.required,
        Validators.email,
        Validators.minLength(Database.MIN_MAIL_LENGTH),
        Validators.maxLength(Database.MAX_MAIL_LENGTH),
      ],
    ],
  });

  protected readonly isValid = injectIsValid(this.form);

  readonly submitSettings = output<BackendType['InstanceSettingVersionCheckDto']>();

  readonly settings = input.required({
    transform: (it: BackendType['InstanceSettingsResponse']) => {
      this.form.patchValue({
        ...it,
        versionCheckAdminMailSendToEveryone: !it.versionCheckAdminMailTo,
      });
      return it;
    },
  });

  readonly isLoading = input(false, {transform: booleanAttribute});

  protected readonly versionCheckEnabled = computed(() => this.settings().versionCheckEnabled);

  protected onSubmit() {
    const it = this.form.getRawValue();
    this.submitSettings.emit({
      ...it,
      versionCheckAdminMailTo: it.versionCheckAdminMailSendToEveryone
        ? undefined
        : (it.versionCheckAdminMailTo ?? undefined),
    });
  }

  constructor() {
    this.infoStore.loadVersion();

    inject(InstanceSettingsVersionCheckStore).makeVersionCheck(
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
