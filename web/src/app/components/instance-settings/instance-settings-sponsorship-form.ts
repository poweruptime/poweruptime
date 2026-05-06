import {DatePipe} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
  linkedSignal,
} from '@angular/core';
import {ReactiveFormsModule, Validators} from '@angular/forms';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmCardImports} from '@spartan-ng/helm/card';
import {HlmFieldImports} from '@spartan-ng/helm/field';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmInputGroupImports} from '@spartan-ng/helm/input-group';
import {HlmLabelImports} from '@spartan-ng/helm/label';
import {HlmSwitchImports} from '@spartan-ng/helm/switch';
import {HlmTooltipImports} from '@spartan-ng/helm/tooltip';
import {format} from '@std/fmt/duration';

import {BackendType, Database} from '@app/api';
import {AbstractModelEditFormComponent, SaveButton, injectIsValid} from '@app/form';
import {InfoStore} from '@app/services';

import {SupporterBadge} from '../supporter-badge';
import {TableLoadingBar} from '../table-loading-bar';

@Component({
  template: `
    @let time = infoStore.time();
    @let support = infoStore.support();

    <section class="h-full" hlmCard>
      <div class="flex items-center justify-between" hlmCardHeader>
        <div class="flex flex-col gap-2">
          <h3 hlmCardTitle>{{ 'general.sponsorship' | transloco }}</h3>
          <p hlmCardDescription>Support the project and show your appreciation</p>
        </div>
        @if (time?.serverSetupTime; as serverSetupTime) {
          <span
            class="text-gray-600 dark:text-gray-300"
            [hlmTooltip]="'Since ' + (serverSetupTime | date: 'dd.MM.yyyy')">
            {{ usingPoweruptimeFor() }} running
          </span>
        }
      </div>

      <div class="mt-2 mb-6 flex flex-col gap-2">
        <pu-table-loading-bar [loading]="isLoading()" />
        @if (support?.supportsSince; as supportsSince) {
          <p class="text-center">
            <b class="text-xl">
              Thank's for your support
              <i class="break-keep whitespace-nowrap">{{ settings().supportLookup }}&nbsp;</i>
              <span>❤️</span>
            </b>
          </p>
          <div class="mt-4 mb-4 flex justify-center">
            <pu-supporter-badge [supportsSince]="supportsSince" />
          </div>
        } @else {
          <h2 class="text-center text-3xl">We ❤️ our Supporters</h2>
          <p class="text-center">
            <b>Please consider supporting poweruptime through GitHub Sponsors.</b>
          </p>
        }
        <b class="flex items-center justify-center gap-2 underline">
          <a href="https://github.com/sponsors/Dafnik" target="_blank" rel="noopener">
            GitHub Sponsors
          </a>
          <ng-icon name="bootstrapBoxArrowUpRight" />
        </b>
      </div>

      <hr />

      @let _sponsorLookupEnabled = sponsorLookupEnabled();
      <div class="relative">
        <div
          class="transition-all duration-100"
          [class.blur-lg]="!_sponsorLookupEnabled"
          [class.pointer-events-none]="!_sponsorLookupEnabled"
          [class.saturate-50]="!_sponsorLookupEnabled">
          <div class="space-y-4" hlmCardContent>
            <form
              class="mt-6 flex min-h-60 flex-col gap-4"
              id="sponsorship-form"
              #formRef
              [formGroup]="form"
              (ngSubmit)="submit()">
              <hlm-field>
                <label hlmFieldLabel for="supportLookup">
                  {{ 'instanceSettings.sponsorship.githubHandle' | transloco }}
                </label>
                <div hlmInputGroup>
                  <input
                    id="supportLookup"
                    autocomplete="off"
                    hlmInputGroupInput
                    formControlName="supportLookup"
                    type="text"
                    placeholder="GitHubUser1234" />
                  <div hlmInputGroupAddon>
                    <ng-icon hlm size="sm" name="lucideGithub" />
                  </div>
                </div>
                @let supportLookup = form.controls.supportLookup.errors;
                @if (supportLookup?.['minlength']; as minlength) {
                  <hlm-field-error>
                    {{ 'form.validation.minlength' | transloco: minlength }}
                  </hlm-field-error>
                }
                @if (supportLookup?.['maxlength']; as maxlength) {
                  <hlm-field-error>
                    {{ 'form.validation.maxlength' | transloco: maxlength }}
                  </hlm-field-error>
                }
              </hlm-field>

              <label class="flex items-center" hlmLabel for="showSupportBadge">
                <hlm-switch
                  class="mr-2"
                  inputId="showSupportBadge"
                  formControlName="showSupportBadge" />
                {{ 'instanceSettings.sponsorship.showBadge' | transloco }}
              </label>
            </form>
          </div>

          <div class="flex flex-row justify-between gap-2" hlmCardFooter>
            <pu-save-button [valid]="isValid()" form="sponsorship-form" />

            <button
              (click)="
                submitCreate.emit({
                  showSupportBadge: form.controls.showSupportBadge.getRawValue(),
                  supportLookup: undefined,
                });
                sponsorLookupEnabled.set(false)
              "
              type="button"
              hlmBtn
              variant="outline">
              <ng-icon hlm size="sm" name="bootstrapXCircleFill" />
              <span class="text-lg">{{ 'general.disable' | transloco }}</span>
            </button>
          </div>
        </div>

        @if (!_sponsorLookupEnabled) {
          <div class="absolute inset-0 z-10 bg-transparent"></div>
          <div class="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 px-20">
            <div>
              <strong>{{ 'instanceSettings.sponsorship.warning.1' | transloco }}</strong>
              <div class="mt-4">
                <i>{{ 'instanceSettings.sponsorship.warning.2' | transloco }}</i>
              </div>
              <ul class="list-disc">
                <li>{{ 'instanceSettings.sponsorship.warning.3' | transloco }}</li>
                <li>{{ 'instanceSettings.sponsorship.warning.4' | transloco }}</li>
              </ul>
            </div>
            <button (click)="sponsorLookupEnabled.set(true)" type="button" hlmBtn variant="outline">
              {{ 'general.enable' | transloco }}
            </button>
          </div>
        }

        <div class="mt-4 text-center"></div>
      </div>
    </section>
  `,
  selector: 'pu-instance-settings-sponsorship-form',
  imports: [
    SaveButton,
    SupporterBadge,
    TableLoadingBar,
    ReactiveFormsModule,
    TranslocoPipe,
    DatePipe,
    HlmCardImports,
    HlmTooltipImports,
    HlmButtonImports,
    HlmIconImports,
    HlmLabelImports,
    HlmSwitchImports,
    HlmInputGroupImports,
    HlmFieldImports,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstanceSettingsSponsorshipForm extends AbstractModelEditFormComponent<
  BackendType['InstanceSettingSupportDto'],
  BackendType['InstanceSettingSupportDto']
> {
  readonly infoStore = inject(InfoStore);

  override disableInputFocus = true;
  override form = this.fb.nonNullable.group({
    supportLookup: [
      null as string | null,
      [
        Validators.minLength(Database.MIN_SUPPORT_LOOKUP_LENGTH),
        Validators.maxLength(Database.MAX_SUPPORT_LOOKUP_LENGTH),
      ],
    ],
    showSupportBadge: [false, [Validators.required]],
  });

  settings = input.required({
    transform: (it: BackendType['InstanceSettingsResponse']) => {
      this.form.patchValue(it);
      return it;
    },
  });

  isLoading = input(false, {transform: booleanAttribute});

  readonly sponsorLookupEnabled = linkedSignal(computed(() => !!this.settings().supportLookup));
  readonly isValid = injectIsValid(this.form);

  readonly usingPoweruptimeFor = computed(() => {
    const serverSetupTime = this.infoStore.time()?.serverSetupTime;
    if (!serverSetupTime) {
      return undefined;
    }

    const duration = new Date().getTime() - new Date(serverSetupTime).getTime();
    return format(duration, {ignoreZero: true, style: 'full'}).split(',')[0];
  });

  constructor() {
    super();
    this.infoStore.loadTime();
    this.infoStore.loadSupport();
  }
}
