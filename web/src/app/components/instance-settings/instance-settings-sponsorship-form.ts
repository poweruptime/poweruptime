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
import {MatButton} from '@angular/material/button';
import {MatCard, MatCardContent, MatCardHeader} from '@angular/material/card';
import {MatError, MatFormField, MatInput, MatLabel} from '@angular/material/input';
import {MatProgressBar} from '@angular/material/progress-bar';
import {MatSlideToggle} from '@angular/material/slide-toggle';
import {MatTooltip} from '@angular/material/tooltip';

import {TranslocoPipe} from '@jsverse/transloco';
import {format} from '@std/fmt/duration';
import {BiComponent} from 'dfx-bootstrap-icons';

import {BackendType, Database} from '@app/api';
import {AbstractModelEditFormComponent, SaveButton, injectIsValid} from '@app/form';

import {JsonService} from '../../services/json.service';
import {SupporterBadge} from '../supporter-badge';

@Component({
  template: `
    <mat-card appearance="outlined">
      <mat-card-header>
        <div class="flex w-full items-center justify-between gap-2">
          <h3 class="text-xl">
            {{ 'general.sponsorship' | transloco }}
          </h3>
          @if (jsonService.json()?.serverSetupTime; as serverSetupTime) {
            <span
              class="text-gray-600 dark:text-gray-300"
              [matTooltip]="'Since ' + (serverSetupTime | date: 'dd.MM.YYYY')">
              Running poweruptime for {{ usingPoweruptimeFor() }}
            </span>
          }
        </div>
      </mat-card-header>
      <mat-card-content>
        <div class="mb-6 mt-6 flex flex-col gap-2">
          @if (isLoading()) {
            <mat-progress-bar mode="indeterminate" />
          }
          @if (jsonService.json()?.supportsSince; as supportsSince) {
            <p class="text-center">
              <b class="text-xl">
                Thank's for your support
                <i>{{ settings()?.supportLookup }}</i>
                <span class="motion-preset-pulse-sm">❤️</span>
              </b>
            </p>
            <div class="mb-4 mt-4 flex justify-center">
              <pu-supporter-badge [supportsSince]="supportsSince" />
            </div>
          } @else {
            <h2 class="text-center text-3xl">We ❤️ our Supporters</h2>
            <p><b>Please consider supporting poweruptime through GitHub Sponsors.</b></p>
          }
          <b class="flex items-center justify-center gap-2 underline">
            <a href="https://github.com/sponsors/Dafnik" target="_blank" rel="noopener">
              Dafnik's GitHub Sponsors Profile
            </a>
            <bi name="box-arrow-up-right" />
          </b>
        </div>

        <hr />

        @let _sponsorLookupEnabled = sponsorLookupEnabled();
        <div class="relative rounded shadow">
          <div
            class="transition-all duration-100"
            [class.filter]="!_sponsorLookupEnabled"
            [class.blur-lg]="!_sponsorLookupEnabled"
            [class.pointer-events-none]="!_sponsorLookupEnabled">
            <form
              class="mt-6 flex min-h-60 flex-col gap-4"
              id="sponsorship-form"
              #formRef
              [formGroup]="form"
              (ngSubmit)="submit()">
              <mat-form-field>
                <mat-label>{{ 'instanceSettings.sponsorship.githubHandle' | transloco }}</mat-label>
                <input matInput formControlName="supportLookup" />

                @let supportLookup = form.controls.supportLookup.errors;
                @if (supportLookup?.['minlength']; as minlength) {
                  <mat-error>{{ 'form.validation.minlength' | transloco: minlength }}</mat-error>
                }
                @if (supportLookup?.['maxlength']; as maxlength) {
                  <mat-error>{{ 'form.validation.maxlength' | transloco: maxlength }}</mat-error>
                }
              </mat-form-field>

              <mat-slide-toggle formControlName="showSupportBadge">
                {{ 'instanceSettings.sponsorship.showBadge' | transloco }}
              </mat-slide-toggle>

              <div class="mt-auto flex items-center justify-between gap-4">
                <pu-save-button [valid]="isValid()" form="sponsorship-form" />

                <button
                  class="error-button"
                  (click)="
                    submitCreate.emit({
                      showSupportBadge: form.controls.showSupportBadge.getRawValue(),
                      supportLookup: undefined,
                    })
                  "
                  type="button"
                  mat-flat-button>
                  <bi name="x-circle-fill" />
                  <span class="text-lg">{{ 'general.reset' | transloco }}</span>
                </button>
              </div>
            </form>
          </div>

          <!-- Centered Material button, only when lookup is disabled -->
          @if (!_sponsorLookupEnabled) {
            <div class="absolute inset-0 z-10 bg-transparent"></div>
            <div class="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 px-4">
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
              <button (click)="sponsorLookupEnabled.set(true)" type="button" mat-flat-button>
                {{ 'general.enable' | transloco }}
              </button>
            </div>
          }

          <div class="mt-4 text-center"></div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  selector: 'pu-instance-settings-sponsorship-form',
  imports: [
    ReactiveFormsModule,
    MatSlideToggle,
    MatCard,
    MatCardContent,
    MatCardHeader,
    SaveButton,
    TranslocoPipe,
    MatButton,
    MatError,
    MatFormField,
    MatInput,
    MatLabel,
    MatTooltip,
    DatePipe,
    BiComponent,
    SupporterBadge,
    MatProgressBar,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstanceSettingsSponsorshipForm extends AbstractModelEditFormComponent<
  BackendType['InstanceSettingSupportDto'],
  BackendType['InstanceSettingSupportDto']
> {
  readonly jsonService = inject(JsonService);

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
    const serverSetupTime = this.jsonService.json()?.serverSetupTime;
    if (!serverSetupTime) {
      return undefined;
    }

    const duration = new Date().getTime() - new Date(serverSetupTime).getTime();
    return format(duration, {ignoreZero: true, style: 'full'}).split(',')[0];
  });
}
