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
import {MatError, MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatProgressBar} from '@angular/material/progress-bar';
import {MatOption, MatSelect, MatSelectTrigger} from '@angular/material/select';
import {MatSlideToggle} from '@angular/material/slide-toggle';

import {distinctUntilChanged, map} from 'rxjs';

import {TranslocoPipe} from '@jsverse/transloco';
import {BiComponent} from 'dfx-bootstrap-icons';
import {NgxMatSelectSearchModule} from 'ngx-mat-select-search';

import {BackendType, Database} from '@app/api';
import {NotificationMethodSelector} from '@app/components/monitor';
import {AbstractModelEditFormComponent, SaveButton, injectIsValid} from '@app/form';
import {NotificationMethodsStore} from '@app/services';
import {NANO_ID_SMALL_LENGTH, nanoid} from '@app/util';

import {MonitorEditFormDataService} from './monitor-edit-form-data.service';
import {MonitorEditFormDnsData} from './monitor-edit-form-dns-data';
import {MonitorEditFormHttpData} from './monitor-edit-form-http-data';
import {MonitorEditFormPingData} from './monitor-edit-form-ping-data';
import {MonitorEditFormPushData} from './monitor-edit-form-push-data';
import {MonitorEditFormSSLCertificateData} from './monitor-edit-form-ssl-certificate-data';

// Number of seconds in a day
const SECONDS_IN_DAY = 86400;
// Number of seconds in an hour
const SECONDS_IN_HOUR = 3600;
// Number of seconds in a minute
const SECONDS_IN_MINUTE = 60;

type TestIntervalUnits = 'seconds' | 'minutes' | 'hours' | 'days';

const CHECKER_DATA_TYPES = [
  {
    label: 'DNS',
    value: 'DNS',
  },
  {
    label: 'HTTP',
    value: 'HTTP',
  },
  {
    label: 'Ping (Port)',
    value: 'PING',
  },
  {
    label: 'Push',
    value: 'PUSH',
  },
  {
    label: 'SSL Certificate',
    value: 'SSL_CERTIFICATE',
  },
] satisfies {value: BackendType['MonitorCheckerData']['_type']; label: string}[];

@Component({
  template: `
    <div class="mb-6 flex gap-8">
      <form class="flex flex-col gap-3" id="form" #formRef [formGroup]="form" (ngSubmit)="submit()">
        <div class="flex gap-2">
          <mat-form-field>
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

          <mat-form-field>
            <mat-label>{{ 'general.type' | transloco }}</mat-label>
            <mat-select formControlName="type">
              <mat-option class="pt-1">
                <ngx-mat-select-search [formControl]="typeFilterControl">
                  <bi name="x-lg" ngxMatSelectSearchClear />
                </ngx-mat-select-search>
              </mat-option>
              @for (type of filteredTypes(); track type.value) {
                <mat-option [value]="type.value">{{ type.label }}</mat-option>
              }
            </mat-select>
            @let typeErrors = form.controls.type.errors;
            @if (typeErrors?.['required']) {
              <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
            }
          </mat-form-field>
        </div>

        <mat-form-field>
          <mat-label>{{ 'general.description' | transloco }}</mat-label>
          <textarea
            matInput
            formControlName="description"
            cdkTextareaAutosize
            cdkAutosizeMinRows="1"
            cdkAutosizeMaxRows="12"></textarea>
        </mat-form-field>

        <div class="flex gap-2">
          <mat-form-field>
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

          <mat-form-field>
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

          <mat-form-field>
            <mat-label>{{ 'monitor.edit.resendAfter' | transloco }}</mat-label>
            <input matInput type="number" formControlName="resendAfter" />
            @let resendAfterErrors = form.controls.resendAfter.errors;
            @if (resendAfterErrors?.['min']; as min) {
              <mat-error>{{ 'form.validation.min' | transloco: min }}</mat-error>
            }
            @if (resendAfterErrors?.['pattern']) {
              <mat-error>{{ 'form.validation.integer' | transloco }}</mat-error>
            }
          </mat-form-field>
        </div>

        <mat-slide-toggle formControlName="upsideDown">
          {{ 'monitor.edit.upsideDown' | transloco }}
        </mat-slide-toggle>

        <h2 class="mb-2 mt-6 text-2xl">{{ 'general.data' | transloco }}</h2>

        @if (form.controls.type.getRawValue() !== '') {
          @let type = form.controls.type.getRawValue();

          @defer (when type === 'DNS') {
            @if (type === 'DNS') {
              <pu-monitor-edit-form-dns-data />
            }
          }

          @defer (when type === 'HTTP') {
            @if (type === 'HTTP') {
              <pu-monitor-edit-form-http-data />
            }
          }

          @defer (when type === 'PING') {
            @if (type === 'PING') {
              <pu-monitor-edit-form-ping-data />
            }
          }

          @defer (when type === 'PUSH') {
            @if (type === 'PUSH') {
              <pu-monitor-edit-form-push-data />
            }
          }

          @defer (when type === 'SSL_CERTIFICATE') {
            @if (type === 'SSL_CERTIFICATE') {
              <pu-monitor-edit-form-ssl-certificate-data />
            }
          }
        } @else {
          <span>{{ 'monitor.edit.selectTypeToContinue' | transloco }}</span>
        }
      </form>

      <div class="w-full">
        <pu-notification-method-selector
          class="w-full"
          [(selectedNotificationMethods)]="_selectedNotificationMethods"
          [(searchNotificationMethod)]="searchNotificationMethod"
          [notificationMethods]="filteredNotificationMethods()"
          [isPending]="isNotificationMethodsPending()" />

        @if (monitor() === undefined && notificationMethodsStore.isPending()) {
          <mat-progress-bar mode="indeterminate" />
        }
      </div>
    </div>

    <pu-save-button [valid]="isValid()" />
  `,
  selector: 'pu-monitor-edit-form',
  imports: [
    ReactiveFormsModule,
    TranslocoPipe,
    MatFormField,
    MatInput,
    MatLabel,
    MatError,
    MatSelect,
    MatSelectTrigger,
    MatOption,
    MatSlideToggle,
    SaveButton,
    MonitorEditFormDnsData,
    MonitorEditFormHttpData,
    MonitorEditFormSSLCertificateData,
    MonitorEditFormPingData,
    NotificationMethodSelector,
    MonitorEditFormPushData,
    NgxMatSelectSearchModule,
    BiComponent,
    MatProgressBar,
    LowerCasePipe,
    CdkTextareaAutosize,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [NotificationMethodsStore],
})
export class MonitorEditForm extends AbstractModelEditFormComponent<
  BackendType['CreateMonitorDto'] & BackendType['SetMonitorNotificationMethodsDto'],
  BackendType['UpdateMonitorDto'] & BackendType['SetMonitorNotificationMethodsDto']
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
    return CHECKER_DATA_TYPES.filter((it) => it.value.trim().toLowerCase().includes(filter));
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
  readonly isNotificationMethodsPending = input.required<boolean>();
  readonly searchNotificationMethod = model('');
  readonly selectedNotificationMethods =
    input.required<BackendType['NotificationMethodMinResponse'][]>();

  readonly notificationMethodsStore = inject(NotificationMethodsStore);

  readonly filteredNotificationMethods = computed(() => {
    const selectedNotificationMethodIds = this._selectedNotificationMethods().map((it) => it.id);
    return this.allNotificationMethods().filter(
      (it) => !selectedNotificationMethodIds.includes(it.id),
    );
  });

  readonly _selectedNotificationMethods = linkedSignal<
    {
      selectedNotificationMethods: BackendType['NotificationMethodMinResponse'][];
      defaultSelectedNotificationMethods: BackendType['NotificationMethodMinResponse'][];
      isCreating: boolean;
    },
    BackendType['NotificationMethodMinResponse'][]
  >({
    source: computed(() => ({
      selectedNotificationMethods: this.selectedNotificationMethods(),
      defaultSelectedNotificationMethods: this.notificationMethodsStore.entities(),
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

    this.notificationMethodsStore.load(
      computed(() => ({
        teamId: this.selectedTeamId(),
        page: 0,
        size: 100,
        sort: ['name,ASC'],
        useByDefault: true,
        search: '',
        types: [],
      })),
    );
  }

  override overrideRawValue(value: ReturnType<typeof this.form.getRawValue>): unknown {
    return {
      ...value,
      ids: this._selectedNotificationMethods().map((it) => it.id),
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

function getTestIntervalSeconds(testInterval: number, testIntervalUnit: TestIntervalUnits): number {
  switch (testIntervalUnit) {
    case 'days':
      return testInterval * SECONDS_IN_DAY;
    case 'hours':
      return testInterval * SECONDS_IN_HOUR;
    case 'minutes':
      return testInterval * SECONDS_IN_MINUTE;
    case 'seconds':
    default:
      return testInterval;
  }
}

function getTestInterval(testIntervalInSeconds: number): {
  testInterval: number;
  testIntervalUnit: TestIntervalUnits;
} {
  // Check if it is a whole number of days
  if (testIntervalInSeconds % SECONDS_IN_DAY === 0) {
    return {
      testInterval: testIntervalInSeconds / SECONDS_IN_DAY,
      testIntervalUnit: 'days',
    };
  }
  // Check if it is a whole number of hours
  else if (testIntervalInSeconds % SECONDS_IN_HOUR === 0) {
    return {
      testInterval: testIntervalInSeconds / SECONDS_IN_HOUR,
      testIntervalUnit: 'hours',
    };
  }
  // Check if it is a whole number of minutes
  else if (testIntervalInSeconds % SECONDS_IN_MINUTE === 0) {
    return {
      testInterval: testIntervalInSeconds / SECONDS_IN_MINUTE,
      testIntervalUnit: 'minutes',
    };
  }
  // Otherwise, default to seconds
  else {
    return {
      testInterval: testIntervalInSeconds,
      testIntervalUnit: 'seconds',
    };
  }
}

const testIntervalSecondsValidators = [
  Validators.min(Database.MIN_TEST_INTERVAL_SECONDS),
  Validators.max(Database.MAX_TEST_INTERVAL_SECONDS),
];
const testIntervalMinutesValidators = [
  Validators.min(1),
  Validators.max(Database.MAX_TEST_INTERVAL_SECONDS / SECONDS_IN_MINUTE),
];
const testIntervalHoursValidators = [
  Validators.min(1),
  Validators.max(Database.MAX_TEST_INTERVAL_SECONDS / SECONDS_IN_HOUR),
];
const testIntervalDaysValidators = [
  Validators.min(1),
  Validators.max(Database.MAX_TEST_INTERVAL_SECONDS / SECONDS_IN_DAY),
];
