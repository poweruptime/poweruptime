import {CdkTextareaAutosize} from '@angular/cdk/text-field';
import {LowerCasePipe} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  model,
} from '@angular/core';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';
import {FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatAnchor} from '@angular/material/button';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MatError, MatFormField, MatLabel, MatSuffix} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatProgressBar} from '@angular/material/progress-bar';
import {MatOption, MatSelect, MatSelectTrigger} from '@angular/material/select';
import {MatSlideToggle} from '@angular/material/slide-toggle';
import {RouterLink} from '@angular/router';

import {distinctUntilChanged, map} from 'rxjs';

import {TranslocoPipe} from '@jsverse/transloco';
import {BiComponent} from 'dfx-bootstrap-icons';
import {NgxMatSelectSearchModule} from 'ngx-mat-select-search';

import {BackendType, Database, MONITOR_CHECKER_DATA_TYPES} from '@app/api';
import {AbstractModelEditFormComponent, SaveButton, injectIsValid} from '@app/form';
import {MonitorCheckerDataValueLabelPipe} from '@app/pipes';
import {NANO_ID_SMALL_LENGTH, nanoid} from '@app/util';

import {NotificationMethodSelector} from '../';
import {MonitorEditFormDataService} from './monitor-edit-form-data.service';
import {MonitorEditFormDnsData} from './monitor-edit-form-dns-data';
import {MonitorEditFormHttpData} from './monitor-edit-form-http-data';
import {MonitorEditFormPingData} from './monitor-edit-form-ping-data';
import {MonitorEditFormPushData} from './monitor-edit-form-push-data';
import {MonitorEditFormSSLCertificateData} from './monitor-edit-form-ssl-certificate-data';
import {
  TestIntervalUnits,
  getTestInterval,
  getTestIntervalSeconds,
  testIntervalDaysValidators,
  testIntervalHoursValidators,
  testIntervalMinutesValidators,
  testIntervalSecondsValidators,
} from './test-interval';

@Component({
  template: `
    <div class="mb-6 grid gap-6 lg:grid-cols-2">
      <form
        class="grid grid-cols-6 gap-2"
        id="form"
        #formRef
        [formGroup]="form"
        (ngSubmit)="submit()">
        <mat-form-field class="col-span-6 md:col-span-4">
          <mat-label>{{ 'general.name' | transloco }}</mat-label>
          <input matInput formControlName="name" />

          @let nameErrors = form.controls.name.errors;
          @if (nameErrors?.['required']) {
            <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
          }
          @if (nameErrors?.['minlength']; as minlength) {
            <mat-error>{{ 'form.validation.minlength' | transloco: minlength }}</mat-error>
          }
          @if (nameErrors?.['maxlength']; as maxlength) {
            <mat-error>{{ 'form.validation.maxlength' | transloco: maxlength }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field class="col-span-6 md:col-span-2">
          <mat-label>{{ 'general.type' | transloco }}</mat-label>
          <mat-select formControlName="type">
            <mat-option class="pt-1">
              <ngx-mat-select-search [formControl]="typeFilterControl">
                <bi name="x-lg" ngxMatSelectSearchClear />
              </ngx-mat-select-search>
            </mat-option>
            @for (type of filteredTypes(); track type.value) {
              <mat-option [value]="type.value">{{ type.label | transloco }}</mat-option>
            }
          </mat-select>
          @let typeErrors = form.controls.type.errors;
          @if (typeErrors?.['required']) {
            <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field class="col-span-6 md:col-span-6">
          <mat-label>{{ 'general.description' | transloco }}</mat-label>
          <textarea
            matInput
            formControlName="description"
            cdkTextareaAutosize
            cdkAutosizeMinRows="3"
            cdkAutosizeMaxRows="12"></textarea>
        </mat-form-field>

        <mat-form-field class="col-span-6 md:col-span-3 2xl:col-span-2">
          <mat-label>
            {{
              'monitor.edit.interval'
                | transloco: {unit: form.controls.testIntervalUnit.getRawValue()}
            }}
          </mat-label>
          <div class="flex">
            <input matInput type="number" step="1" formControlName="testInterval" />
            <div class="w-12 ps-1">
              <mat-select formControlName="testIntervalUnit">
                <mat-select-trigger>
                  {{ form.controls.testIntervalUnit.getRawValue()[0] | lowercase }}
                </mat-select-trigger>
                @for (time of times; track time.value) {
                  <mat-option [value]="time.value">{{ time.value }}</mat-option>
                }
              </mat-select>
            </div>
          </div>
          @let testIntervalErrors = form.controls.testInterval.errors;
          @if (testIntervalErrors?.['required']) {
            <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
          }
          @if (testIntervalErrors?.['min']; as min) {
            <mat-error>{{ 'form.validation.min' | transloco: min }}</mat-error>
          }
          @if (testIntervalErrors?.['max']; as max) {
            <mat-error>{{ 'form.validation.max' | transloco: max }}</mat-error>
          }
          @if (testIntervalErrors?.['pattern']) {
            <mat-error>{{ 'form.validation.integer' | transloco }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field class="col-span-6 md:col-span-3 2xl:col-span-1">
          <mat-label>{{ 'monitor.edit.retries' | transloco }}</mat-label>
          <input matInput type="number" formControlName="retries" />

          @let retriesErrors = form.controls.retries.errors;
          @if (retriesErrors?.['required']) {
            <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
          }
          @if (retriesErrors?.['min']; as min) {
            <mat-error>{{ 'form.validation.min' | transloco: min }}</mat-error>
          }
          @if (retriesErrors?.['pattern']) {
            <mat-error>{{ 'form.validation.integer' | transloco }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field class="col-span-6 2xl:col-span-3">
          <mat-label>{{ 'monitor.edit.resendAfter' | transloco }}</mat-label>
          <input matInput type="number" formControlName="resendAfter" />
          <span class="ms-2 break-keep" matTextSuffix>failed checks</span>
          @let resendAfterErrors = form.controls.resendAfter.errors;
          @if (resendAfterErrors?.['min']; as min) {
            <mat-error>{{ 'form.validation.min' | transloco: min }}</mat-error>
          }
          @if (resendAfterErrors?.['pattern']) {
            <mat-error>{{ 'form.validation.integer' | transloco }}</mat-error>
          }
        </mat-form-field>

        <mat-slide-toggle class="col-span-6" formControlName="upsideDown">
          {{ 'monitor.edit.upsideDown' | transloco }}
        </mat-slide-toggle>

        <mat-card class="col-span-6 mt-8" appearance="outlined">
          @let typeValue = form.controls.type.getRawValue();
          <mat-card-header>
            <mat-card-title>
              @if (typeValue !== '') {
                {{ typeValue | monitorCheckerDataValueLabel | transloco }} -
              }
              {{ 'general.data' | transloco }}
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="h-4"></div>
            @if (typeValue !== '') {
              @defer (when typeValue === 'DNS') {
                @if (typeValue === 'DNS') {
                  <pu-monitor-edit-form-dns-data />
                }
              }

              @defer (when typeValue === 'HTTP') {
                @if (typeValue === 'HTTP') {
                  <pu-monitor-edit-form-http-data />
                }
              }

              @defer (when typeValue === 'PING') {
                @if (typeValue === 'PING') {
                  <pu-monitor-edit-form-ping-data />
                }
              }

              @defer (when typeValue === 'PUSH') {
                @if (typeValue === 'PUSH') {
                  <pu-monitor-edit-form-push-data />
                }
              }

              @defer (when typeValue === 'SSL_CERTIFICATE') {
                @if (typeValue === 'SSL_CERTIFICATE') {
                  <pu-monitor-edit-form-ssl-certificate-data />
                }
              }
            } @else {
              <span>{{ 'monitor.edit.selectTypeToContinue' | transloco }}</span>
            }
          </mat-card-content>
        </mat-card>
      </form>

      <div class="flex flex-col gap-6">
        <mat-card appearance="outlined">
          <mat-card-header>
            <mat-card-title>{{ 'general.notificationMethods' | transloco }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="h-4"></div>
            <pu-notification-method-selector
              class="w-full"
              [(selectedNotificationMethods)]="_selectedNotificationMethods"
              [(searchNotificationMethod)]="searchNotificationMethod"
              [notificationMethods]="filteredNotificationMethods()"
              [isPending]="isNotificationMethodsSearchPending()" />

            @if (
              monitor() !== undefined &&
              (isDefaultSelectedNotificationMethodsPending() ||
                isSelectedNotificationMethodsPending())
            ) {
              <mat-progress-bar mode="indeterminate" />
            }

            <a mat-button routerLink="../../../notification-methods/new" target="_blank">
              {{ 'cmdk.groups.notificationMethod.create' | transloco }}
              <bi class="ms-1" name="box-arrow-up-right" />
            </a>
          </mat-card-content>
        </mat-card>

        <!--        <mat-card appearance="outlined">-->
        <!--          <mat-card-header>-->
        <!--            <mat-card-title>{{ 'general.tags' | transloco }}</mat-card-title>-->
        <!--          </mat-card-header>-->
        <!--          <mat-card-content>-->
        <!--            <div class="h-4"></div>-->
        <!--          </mat-card-content>-->
        <!--        </mat-card>-->
      </div>

      <pu-save-button class="ms-3" [valid]="isValid()" />
    </div>
  `,
  selector: 'pu-monitor-edit-form',
  providers: [MonitorEditFormDataService],
  imports: [
    ReactiveFormsModule,
    LowerCasePipe,
    MatFormField,
    MatInput,
    MatLabel,
    MatError,
    MatSelect,
    MatSelectTrigger,
    MatOption,
    MatSuffix,
    MatSlideToggle,
    MatProgressBar,
    CdkTextareaAutosize,
    TranslocoPipe,
    NgxMatSelectSearchModule,
    BiComponent,
    NotificationMethodSelector,
    SaveButton,
    MonitorEditFormDnsData,
    MonitorEditFormHttpData,
    MonitorEditFormSSLCertificateData,
    MonitorEditFormPingData,
    MonitorEditFormPushData,
    MatCard,
    MatCardContent,
    MatCardTitle,
    MatCardHeader,
    RouterLink,
    MatAnchor,
    MonitorCheckerDataValueLabelPipe,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonitorEditForm extends AbstractModelEditFormComponent<
  BackendType['CreateMonitorDto'],
  BackendType['UpdateMonitorDto']
> {
  private readonly monitorEditFormDataService = inject(MonitorEditFormDataService);

  readonly times = [
    {
      value: 'seconds',
      viewValue: 's',
    },
    {
      value: 'minutes',
      viewValue: 'm',
    },
    {
      value: 'hours',
      viewValue: 'h',
    },
    {
      value: 'days',
      viewValue: 'd',
    },
  ];

  readonly typeFilterControl = new FormControl<string>('');
  readonly typeFilter = toSignal(this.typeFilterControl.valueChanges.pipe(map((it) => it ?? '')), {
    initialValue: '',
  });

  readonly filteredTypes = computed(() => {
    const filter = this.typeFilter().trim().toLowerCase();
    return MONITOR_CHECKER_DATA_TYPES.filter((it) =>
      it.value.trim().toLowerCase().includes(filter),
    );
  });

  override form = this.fb.nonNullable.group({
    id: [undefined as string | undefined],
    teamId: [undefined as string | undefined, [Validators.required]],
    name: [
      '',
      [
        Validators.required,
        Validators.minLength(Database.MIN_NAME_LENGTH),
        Validators.maxLength(Database.MAX_NAME_LENGTH),
      ],
    ],
    description: [undefined as string | undefined],
    type: ['' as BackendType['MonitorCheckerData']['_type'] | '', [Validators.required]],
    testIntervalUnit: ['minutes' as TestIntervalUnits, [Validators.required]],
    testInterval: [
      1,
      [
        Validators.required,
        Validators.pattern(Database.INTEGER_REGEX),
        ...testIntervalMinutesValidators,
      ],
    ],
    retries: [
      0,
      [Validators.required, Validators.pattern(Database.INTEGER_REGEX), Validators.min(0)],
    ],
    resendAfter: [
      undefined as number | undefined,
      [Validators.pattern(Database.INTEGER_REGEX), Validators.min(1)],
    ],
    upsideDown: [false],
  });

  isValid = injectIsValid(this.form);

  monitor = input(undefined, {
    transform: (it: BackendType['MonitorMaxResponse'] | undefined) => {
      this.isCreating.set(!it);
      this.monitorEditFormDataService.pushDataFormGroup.controls.pushId.setValue(
        nanoid(NANO_ID_SMALL_LENGTH),
      );

      if (!it) {
        return undefined;
      }

      if (it.deleted) {
        this.formDisabled = true;
      }

      this.setFormCheckerType(it.checker._type);

      const testInterval = getTestInterval(it.testIntervalSeconds);

      this.form.patchValue({
        ...it,
        type: it.checker._type,
        testInterval: testInterval.testInterval,
        testIntervalUnit: testInterval.testIntervalUnit,
      });

      return it;
    },
  });

  selectedTeamId = input.required({
    transform: (it?: string) => {
      if (it) {
        this.lumber.log('selectedTeamId', 'set selected team', it);
        this.form.controls.teamId.setValue(it);
      }
      return it;
    },
  });

  readonly allNotificationMethods = input.required<BackendType['NotificationMethodResponse'][]>();
  readonly isNotificationMethodsSearchPending = input.required<boolean>();
  searchNotificationMethod = model('');

  readonly isSelectedNotificationMethodsPending = input.required<boolean>();
  readonly selectedNotificationMethods =
    input.required<BackendType['NotificationMethodMinResponse'][]>();

  readonly isDefaultSelectedNotificationMethodsPending = input.required<boolean>();
  readonly defaultNotificationMethods =
    input.required<BackendType['NotificationMethodResponse'][]>();

  readonly filteredNotificationMethods = computed(() => {
    const selectedNotificationMethodIds = this._selectedNotificationMethods().map((it) => it.id);
    return this.allNotificationMethods().filter(
      (it) => !selectedNotificationMethodIds.includes(it.id),
    );
  });

  _selectedNotificationMethods = linkedSignal<
    {
      selectedNotificationMethods: BackendType['NotificationMethodMinResponse'][];
      defaultSelectedNotificationMethods: BackendType['NotificationMethodMinResponse'][];
      isCreating: boolean;
    },
    BackendType['NotificationMethodMinResponse'][]
  >({
    source: computed(() => ({
      selectedNotificationMethods: this.selectedNotificationMethods(),
      defaultSelectedNotificationMethods: this.defaultNotificationMethods(),
      isCreating: this.monitor() === undefined,
    })),
    computation: ({
      selectedNotificationMethods,
      defaultSelectedNotificationMethods,
      isCreating,
    }) => {
      return isCreating ? defaultSelectedNotificationMethods : selectedNotificationMethods;
    },
  });

  constructor() {
    super();

    this.form.controls.type.valueChanges
      .pipe(takeUntilDestroyed(), distinctUntilChanged())
      .subscribe((it) => {
        if (it !== '') {
          this.setFormCheckerType(it);
        }
      });

    this.form.controls.testIntervalUnit.valueChanges
      .pipe(takeUntilDestroyed(), distinctUntilChanged())
      .subscribe((it) => this.setTestIntervalValidators(it));
  }

  override overrideRawValue(value: ReturnType<typeof this.form.getRawValue>): unknown {
    return {
      ...value,
      notificationMethodIds: this._selectedNotificationMethods().map((it) => it.id),
      testIntervalSeconds: getTestIntervalSeconds(value.testInterval, value.testIntervalUnit),
    };
  }

  private setFormCheckerType(type: BackendType['MonitorCheckerData']['_type']) {
    // @ts-expect-error Checker Form Control
    this.form.setControl('checker', this.monitorEditFormDataService.formCheckerFactory(type));

    // @ts-expect-error Checker Form Control
    this.form.controls['checker'].patchValue({
      _type: type,
    });
  }

  private setTestIntervalValidators(it: TestIntervalUnits) {
    this.form.controls.testInterval.removeValidators(testIntervalSecondsValidators);
    this.form.controls.testInterval.removeValidators(testIntervalMinutesValidators);
    this.form.controls.testInterval.removeValidators(testIntervalHoursValidators);
    this.form.controls.testInterval.removeValidators(testIntervalDaysValidators);

    switch (it) {
      case 'days':
        this.form.controls.testInterval.addValidators(testIntervalDaysValidators);
        break;
      case 'hours':
        this.form.controls.testInterval.addValidators(testIntervalHoursValidators);
        break;
      case 'minutes':
        this.form.controls.testInterval.addValidators(testIntervalMinutesValidators);
        break;
      case 'seconds':
      default:
        this.form.controls.testInterval.addValidators(testIntervalSecondsValidators);
        break;
    }

    this.form.controls.testInterval.updateValueAndValidity();
    this.form.updateValueAndValidity();
  }
}
