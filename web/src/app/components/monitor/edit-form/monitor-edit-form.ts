import {LowerCasePipe} from '@angular/common';
import {ChangeDetectionStrategy, Component, inject, input, model} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {ReactiveFormsModule, Validators} from '@angular/forms';
import {RouterLink} from '@angular/router';

import {CdkTextareaAutosize} from '@angular/cdk/text-field';

import {distinctUntilChanged} from 'rxjs';

import {TranslocoPipe} from '@jsverse/transloco';
import '@spartan-ng/brain/select';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmCardImports} from '@spartan-ng/helm/card';
import {HlmDropdownMenuImports} from '@spartan-ng/helm/dropdown-menu';
import {HlmFieldImports} from '@spartan-ng/helm/field';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmInputImports} from '@spartan-ng/helm/input';
import {HlmInputGroupImports} from '@spartan-ng/helm/input-group';
import {HlmLabelImports} from '@spartan-ng/helm/label';
import {HlmProgressImports} from '@spartan-ng/helm/progress';
import {HlmSelectImports} from '@spartan-ng/helm/select';
import {HlmSeparatorImports} from '@spartan-ng/helm/separator';
import {HlmSwitchImports} from '@spartan-ng/helm/switch';
import {HlmTextareaImports} from '@spartan-ng/helm/textarea';

import {BackendType, Database, MONITOR_CHECKER_DATA_TYPES, MonitorDataType} from '@app/api';
import {AbstractModelEditFormComponent, SaveButton, injectIsValid} from '@app/form';
import {NANO_ID_SMALL_LENGTH, nanoid} from '@app/util';

import {TagSelector} from '../../tag-selector';
import {NotificationMethodSelector} from '../notification-method-selector';
import {MonitorEditFormData} from './monitor-edit-form-data';
import {MonitorEditFormDataService} from './monitor-edit-form-data.service';
import {MonitorEditNotificationMethodsEmpty} from './monitor-edit-notification-methods-empty';
import {
  TestIntervalUnits,
  getTestInterval,
  getTestIntervalSeconds,
  testIntervalDaysValidators,
  testIntervalHoursValidators,
  testIntervalMinutesValidators,
  testIntervalSecondsValidators,
} from './test-interval';

const times = [
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

@Component({
  template: `
    <form
      class="mb-6 grid gap-8 lg:grid-cols-3"
      id="form"
      #formRef
      [formGroup]="form"
      (ngSubmit)="submit()">
      <div class="grid grid-cols-6 gap-8 lg:col-span-2">
        <section class="col-span-6" hlmCard>
          <div hlmCardHeader>
            <div class="flex items-center gap-2">
              <ng-icon name="bootstrapGlobe" />
              <h3 hlmCardTitle>Basic Configuration</h3>
            </div>
            <p hlmCardDescription>Configure the monitor name and type</p>
          </div>
          <div class="grid grid-cols-6 gap-6" hlmCardContent>
            <hlm-field class="col-span-6 md:col-span-4">
              <label hlmFieldLabel for="name">
                {{ 'general.name' | transloco }}
              </label>
              <input
                id="name"
                autocomplete="off"
                hlmInput
                formControlName="name"
                type="text"
                placeholder="Monitor #1" />
              @let nameErrors = form.controls.name.errors;
              @if (nameErrors?.['required']) {
                <hlm-field-error>{{ 'form.validation.required' | transloco }}</hlm-field-error>
              }
              @if (nameErrors?.['minlength']; as minlength) {
                <hlm-field-error>
                  {{ 'form.validation.minlength' | transloco: minlength }}
                </hlm-field-error>
              }
              @if (nameErrors?.['maxlength']; as maxlength) {
                <hlm-field-error>
                  {{ 'form.validation.maxlength' | transloco: maxlength }}
                </hlm-field-error>
              }
            </hlm-field>

            <hlm-field class="col-span-6 md:col-span-2">
              <label hlmFieldLabel for="type">
                {{ 'general.type' | transloco }}
              </label>
              <hlm-select id="type" formControlName="type">
                <hlm-select-trigger class="w-full">
                  <hlm-select-value [placeholder]="'general.type' | transloco" />
                </hlm-select-trigger>
                <hlm-select-content *hlmSelectPortal>
                  <hlm-select-group>
                    @for (type of MONITOR_CHECKER_DATA_TYPES; track type.value) {
                      <hlm-select-item [value]="type.value">
                        {{ type.label | transloco }}
                      </hlm-select-item>
                    }
                  </hlm-select-group>
                </hlm-select-content>
              </hlm-select>

              @let typeErrors = form.controls.type.errors;
              @if (typeErrors?.['required']) {
                <hlm-field-error>{{ 'form.validation.required' | transloco }}</hlm-field-error>
              }
            </hlm-field>

            <hlm-field class="col-span-6">
              <label hlmFieldLabel for="description">{{ 'general.description' | transloco }}</label>
              <textarea
                class="w-full"
                id="description"
                hlmTextarea
                placeholder="Optional Description for this monitor..."
                formControlName="description"
                cdkTextareaAutosize
                cdkAutosizeMinRows="3"
                cdkAutosizeMaxRows="12"></textarea>
            </hlm-field>
          </div>
        </section>

        <section class="col-span-6" hlmCard>
          <div hlmCardHeader>
            <div class="flex items-center gap-2">
              <ng-icon name="lucideClock" />
              <h3 hlmCardTitle>Scheduling & Behavior</h3>
            </div>
            <p hlmCardDescription>Configure check frequency and retry behavior</p>
          </div>
          <div class="grid grid-cols-6 gap-6" hlmCardContent>
            <hlm-field class="col-span-6 md:col-span-3 2xl:col-span-2">
              <label hlmFieldLabel for="testInterval">
                {{
                  'monitor.edit.interval'
                    | transloco: {unit: form.controls.testIntervalUnit.getRawValue()}
                }}
              </label>
              <div hlmInputGroup>
                <input
                  id="testInterval"
                  hlmInputGroupInput
                  type="number"
                  step="1"
                  formControlName="testInterval" />

                <div hlmInputGroupAddon align="inline-end">
                  <button
                    class="!pr-1.5 text-xs"
                    [hlmDropdownMenuTrigger]="testIntervalUnitMenu"
                    type="button"
                    hlmInputGroupButton
                    variant="ghost"
                    align="end">
                    {{ form.controls.testIntervalUnit.getRawValue()[0] | lowercase }}
                    <ng-icon name="lucideChevronDown" />
                  </button>
                </div>
              </div>

              <p hlmFieldDescription>How often to check</p>

              @let testIntervalErrors = form.controls.testInterval.errors;
              @if (testIntervalErrors?.['required']) {
                <hlm-field-error>{{ 'form.validation.required' | transloco }}</hlm-field-error>
              }
              @if (testIntervalErrors?.['min']; as min) {
                <hlm-field-error>{{ 'form.validation.min' | transloco: min }}</hlm-field-error>
              }
              @if (testIntervalErrors?.['max']; as max) {
                <hlm-field-error>{{ 'form.validation.max' | transloco: max }}</hlm-field-error>
              }
              @if (testIntervalErrors?.['pattern']) {
                <hlm-field-error>{{ 'form.validation.integer' | transloco }}</hlm-field-error>
              }

              <ng-template #testIntervalUnitMenu>
                <hlm-dropdown-menu class="w-48">
                  @for (time of times; track time.value) {
                    <button
                      (click)="form.controls.testIntervalUnit.patchValue($any(time.value))"
                      type="button"
                      hlmDropdownMenuItem>
                      {{ time.value }}
                    </button>
                  }
                </hlm-dropdown-menu>
              </ng-template>
            </hlm-field>

            <hlm-field class="col-span-6 md:col-span-3 2xl:col-span-2">
              <label hlmFieldLabel for="retries">{{ 'monitor.edit.retries' | transloco }}</label>

              <input id="retries" hlmInput formControlName="retries" step="1" type="number" />

              <p hlmFieldDescription>Retry before alerting</p>

              @let retriesErrors = form.controls.retries.errors;
              @if (retriesErrors?.['required']) {
                <hlm-field-error>{{ 'form.validation.required' | transloco }}</hlm-field-error>
              }
              @if (retriesErrors?.['min']; as min) {
                <hlm-field-error>{{ 'form.validation.min' | transloco: min }}</hlm-field-error>
              }
              @if (retriesErrors?.['pattern']) {
                <hlm-field-error>{{ 'form.validation.integer' | transloco }}</hlm-field-error>
              }
            </hlm-field>

            <hlm-field class="col-span-6 2xl:col-span-2">
              <label hlmFieldLabel for="resendAfter">
                {{ 'monitor.edit.resendAfter' | transloco }}
              </label>
              <div hlmInputGroup>
                <input
                  id="resendAfter"
                  hlmInputGroupInput
                  type="number"
                  step="1"
                  formControlName="resendAfter" />

                <span class="break-keep" hlmInputGroupAddon align="inline-end">failed checks</span>
              </div>

              <p hlmFieldDescription>Notification resending</p>

              @let resendAfterErrors = form.controls.resendAfter.errors;
              @if (resendAfterErrors?.['min']; as min) {
                <hlm-field-error>{{ 'form.validation.min' | transloco: min }}</hlm-field-error>
              }
              @if (resendAfterErrors?.['pattern']) {
                <hlm-field-error>{{ 'form.validation.integer' | transloco }}</hlm-field-error>
              }
            </hlm-field>

            <hlm-separator class="col-span-6" />

            <div class="col-span-6">
              <label class="inline-flex items-center" hlmLabel for="upsideDown">
                <hlm-switch class="mr-2" inputId="upsideDown" formControlName="upsideDown" />
                {{ 'monitor.edit.upsideDown' | transloco }}
              </label>
            </div>
          </div>
        </section>

        <pu-monitor-edit-form-data class="col-span-6" [type]="form.controls.type.getRawValue()" />
      </div>

      <div class="flex flex-col gap-8 lg:col-span-1">
        <section hlmCard>
          <div hlmCardHeader>
            <h3 hlmCardTitle>{{ 'general.notificationMethods' | transloco }}</h3>
          </div>
          <div hlmCardContent>
            @if (
              allNotificationMethods().length === 0 &&
              searchNotificationMethod().length === 0 &&
              !isNotificationMethodsSearchPending()
            ) {
              <pu-monitor-edit-notification-methods-empty />
            } @else {
              <div class="grid gap-6">
                <pu-notification-method-selector
                  [(searchNotificationMethod)]="searchNotificationMethod"
                  [notificationMethods]="allNotificationMethods()"
                  [isPending]="isNotificationMethodsSearchPending()"
                  formControlName="notificationMethods" />

                @if (!monitor() && isDefaultSelectedNotificationMethodsPending()) {
                  <hlm-progress>
                    <hlm-progress-indicator />
                  </hlm-progress>
                }

                <div>
                  <a
                    hlmBtn
                    variant="link"
                    routerLink="../../notification-methods/new"
                    target="_blank">
                    {{ 'notificationMethod.edit.create' | transloco }}
                    <ng-icon hlm size="sm" name="bootstrapBoxArrowUpRight" />
                  </a>
                </div>
              </div>
            }
          </div>
        </section>

        <section hlmCard>
          <div hlmCardHeader>
            <h3 hlmCardTitle>{{ 'general.tags' | transloco }}</h3>
          </div>
          <div hlmCardContent>
            <pu-tag-selector
              [(searchTag)]="searchTag"
              [tags]="allTags()"
              [isPending]="isTagsSearchPending()"
              formControlName="tags" />
          </div>
        </section>
      </div>

      <pu-save-button class="ms-3" [valid]="isValid()" />
    </form>
  `,
  selector: 'pu-monitor-edit-form',
  providers: [MonitorEditFormDataService],
  imports: [
    SaveButton,
    NotificationMethodSelector,
    TagSelector,
    MonitorEditNotificationMethodsEmpty,
    ReactiveFormsModule,
    LowerCasePipe,
    RouterLink,
    CdkTextareaAutosize,
    TranslocoPipe,
    HlmCardImports,
    HlmButtonImports,
    HlmIconImports,
    HlmLabelImports,
    HlmSwitchImports,
    HlmProgressImports,
    HlmInputGroupImports,
    HlmSelectImports,
    HlmTextareaImports,
    HlmSeparatorImports,
    HlmDropdownMenuImports,
    HlmInputImports,
    MonitorEditFormData,
    HlmFieldImports,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonitorEditForm extends AbstractModelEditFormComponent<
  BackendType['CreateMonitorDto'],
  BackendType['UpdateMonitorDto']
> {
  protected readonly MONITOR_CHECKER_DATA_TYPES = MONITOR_CHECKER_DATA_TYPES;
  protected readonly times = times;

  private readonly monitorEditFormDataService = inject(MonitorEditFormDataService);

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
    type: ['' as MonitorDataType | '', [Validators.required]],
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
      undefined as number | undefined,
      [Validators.pattern(Database.INTEGER_REGEX), Validators.min(1)],
    ],
    resendAfter: [
      undefined as number | undefined,
      [Validators.pattern(Database.INTEGER_REGEX), Validators.min(1)],
    ],
    upsideDown: [false],
    notificationMethods: [[] as BackendType['NotificationMethodMinResponse'][]],
    tags: [[] as BackendType['TagDto'][]],
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

      this.setFormCheckerType(it.data._type);

      const testInterval = getTestInterval(it.testIntervalSeconds);

      this.form.patchValue({
        ...it,
        type: it.data._type,
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

  readonly isDefaultSelectedNotificationMethodsPending = input.required<boolean>();
  readonly defaultNotificationMethods = input.required({
    transform: (it: BackendType['NotificationMethodResponse'][]) => {
      if (this.isCreating()) {
        this.form.controls.notificationMethods.patchValue(it);
      }
      return it;
    },
  });

  readonly allTags = input.required<BackendType['TagDto'][]>();
  readonly isTagsSearchPending = input.required<boolean>();
  searchTag = model('');

  constructor() {
    super();

    this.form.controls.type.valueChanges
      .pipe(takeUntilDestroyed(), distinctUntilChanged())
      .subscribe((type) => {
        if (type !== '') {
          this.setFormCheckerType(type);
        }
      });

    this.form.controls.testIntervalUnit.valueChanges
      .pipe(takeUntilDestroyed(), distinctUntilChanged())
      .subscribe((it) => this.setTestIntervalValidators(it));
  }

  override overrideRawValue(value: ReturnType<typeof this.form.getRawValue>): unknown {
    return {
      ...value,
      notificationMethodIds: value.notificationMethods.map((it) => it.id),
      testIntervalSeconds: getTestIntervalSeconds(value.testInterval, value.testIntervalUnit),
    };
  }

  private setFormCheckerType(type: MonitorDataType | '') {
    // @ts-expect-error Checker Form Control
    this.form.setControl('data', this.monitorEditFormDataService.formCheckerFactory(type));

    // @ts-expect-error Checker Form Control
    this.form.controls['data'].patchValue({
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
