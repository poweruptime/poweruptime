import {
  ChangeDetectionStrategy,
  Component,
  Pipe,
  PipeTransform,
  computed,
  effect,
  inject,
  input,
  model,
} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {FormControl, ReactiveFormsModule, Validators} from '@angular/forms';

import {map} from 'rxjs';

import {TranslocoPipe} from '@jsverse/transloco';
import {BrnSelectImports} from '@spartan-ng/brain/select';
import {HlmCardImports} from '@spartan-ng/helm/card';
import {HlmFormFieldImports} from '@spartan-ng/helm/form-field';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmInputImports} from '@spartan-ng/helm/input';
import {HlmLabelImports} from '@spartan-ng/helm/label';
import {HlmSelectImports} from '@spartan-ng/helm/select';
import {HlmSeparatorImports} from '@spartan-ng/helm/separator';
import {HlmSkeletonImports} from '@spartan-ng/helm/skeleton';
import {HlmSwitchImports} from '@spartan-ng/helm/switch';
import {typeOfArrayElement} from 'dfts-helper';

import {
  BackendType,
  Database,
  MONITOR_CHECKER_DATA_TYPES,
  NOTIFICATION_METHOD_SENDER_DATA_TYPES,
} from '@app/api';
import {AbstractModelEditFormComponent, SaveButton, injectIsValid} from '@app/form';
import {NotificationMethodTemplateStore} from '@app/services';

import {MonitorSelector} from '../monitor-selector';
import {NotificationMethodEditFormData} from './notification-method-edit-form-data';
import {NotificationMethodEditFormDataService} from './notification-method-edit-form-data.service';
import {NotificationMethodEditTemplate} from './notification-method-edit-template';

type TemplateFeatures = NonNullable<BackendType['NotificationMethodTemplateResponse']['features']>;

@Pipe({
  name: 'hasTemplateFeatureEnabled',
  pure: true,
})
class HasTemplateFeatureEnabled implements PipeTransform {
  transform(
    features: TemplateFeatures | undefined,
    feature: typeOfArrayElement<TemplateFeatures>,
  ): boolean {
    return features?.includes(feature) ?? false;
  }
}

@Component({
  template: `
    <form
      class="mb-6 grid gap-6 lg:grid-cols-2"
      id="form"
      #formRef
      [formGroup]="form"
      (ngSubmit)="submit()">
      @let _typeValue = typeValue();

      <div class="flex flex-col gap-8">
        <section class="col-span-6" hlmCard>
          <div hlmCardHeader>
            <div class="flex items-center gap-2">
              <ng-icon name="bootstrapGlobe" />
              <h3 hlmCardTitle>Basic Configuration</h3>
            </div>
            <p hlmCardDescription>Configure the notification method name and type</p>
          </div>
          <div class="grid gap-6 md:grid-cols-6" hlmCardContent>
            <hlm-form-field class="md:col-span-4">
              <label hlmLabel for="name">
                {{ 'general.name' | transloco }}
              </label>
              <input
                id="name"
                autocomplete="off"
                hlmInput
                formControlName="name"
                type="text"
                placeholder="Notification Method #1" />
              @let nameErrors = form.controls.name.errors;
              @if (nameErrors?.['required']) {
                <hlm-error>{{ 'form.validation.required' | transloco }}</hlm-error>
              }
              @if (nameErrors?.['minlength']; as minlength) {
                <hlm-error>{{ 'form.validation.minlength' | transloco: minlength }}</hlm-error>
              }
              @if (nameErrors?.['maxlength']; as maxlength) {
                <hlm-error>{{ 'form.validation.maxlength' | transloco: maxlength }}</hlm-error>
              }
            </hlm-form-field>

            <hlm-form-field class="md:col-span-2">
              <label hlmLabel for="type">
                {{ 'general.type' | transloco }}
              </label>
              <brn-select
                id="type"
                [placeholder]="'general.type' | transloco"
                formControlName="type">
                <hlm-select-trigger class="w-full">
                  <hlm-select-value />
                </hlm-select-trigger>
                <hlm-select-content>
                  @for (type of NOTIFICATION_METHOD_SENDER_DATA_TYPES; track type.value) {
                    <hlm-option [value]="type.value">{{ type.label | transloco }}</hlm-option>
                  }
                </hlm-select-content>
              </brn-select>

              @let typeErrors = form.controls.type.errors;
              @if (typeErrors?.['required']) {
                <hlm-error>{{ 'form.validation.required' | transloco }}</hlm-error>
              }
            </hlm-form-field>

            <label class="col-span-6 flex items-center" hlmLabel for="useByDefault">
              <hlm-switch class="mr-2" id="useByDefault" formControlName="useByDefault" />
              {{ 'notificationMethod.edit.useByDefault' | transloco }}
            </label>
          </div>
        </section>

        <pu-notification-method-edit-form-data [type]="form.controls.type.getRawValue()" />

        <div>
          <section class="w-full" hlmCard>
            <div hlmCardContent>
              <pu-monitor-selector
                [(searchMonitor)]="searchMonitors"
                [monitors]="allMonitors()"
                [isPending]="isMonitorsSearchPending()"
                formControlName="monitors" />
            </div>
          </section>
        </div>

        <div class="flex gap-4">
          <pu-save-button [valid]="isValid()" />
          <!-- i(bootstrapSendCheck) -->
          <pu-save-button
            [valid]="isValid()"
            (buttonClick)="
              form.controls.testSend.patchValue(true);
              submit();
              form.controls.testSend.patchValue(false)
            "
            text="Save (and test)"
            type="button"
            icon="bootstrapSendCheck" />
        </div>
      </div>

      <div>
        <section hlmCard>
          <div hlmCardHeader>
            <h3 hlmCardTitle>{{ 'general.template' | transloco }}</h3>
          </div>
          <div class="grid gap-10" hlmCardContent>
            @if (_typeValue === '') {
              <span>{{ 'notificationMethod.edit.selectTypeToContinue' | transloco }}</span>
            }
            @if (notificationMethodTemplateStore.isPending()) {
              <hlm-skeleton class="h-48 w-full" />
              <hlm-skeleton class="h-24 w-full" />
              <hlm-skeleton class="h-48 w-full" />
              <hlm-skeleton class="h-24 w-full" />
            } @else {
              @let _isCreating = isCreating();
              @if (notificationMethodTemplateStore.template(); as template) {
                @if (template.features | hasTemplateFeatureEnabled: 'TITLE') {
                  <pu-notification-method-edit-template
                    [label]="'notificationMethod.edit.titleTemplate' | transloco"
                    [showReset]="!_isCreating"
                    [disableReset]="
                      form.controls.titleTemplate.getRawValue() === template.titleTemplate
                    "
                    (resetClick)="form.patchValue({titleTemplate: template.titleTemplate})"
                    formControlName="titleTemplate" />

                  <hlm-separator />
                }

                @let _html =
                  template.bodyType === 'HTML' ||
                  template.bodyType === 'MARKDOWN' ||
                  template.bodyType === 'MRKDWN';
                <pu-notification-method-edit-template
                  [html]="_html"
                  [label]="'notificationMethod.edit.body' | transloco"
                  [showReset]="!_isCreating"
                  [disableReset]="
                    form.controls.bodyTemplate.getRawValue() === template.bodyTemplate
                  "
                  (resetClick)="form.patchValue({bodyTemplate: template.bodyTemplate})"
                  formControlName="bodyTemplate" />
              }
            }
          </div>
        </section>
      </div>
    </form>
  `,
  selector: 'pu-notification-method-edit-form',
  providers: [NotificationMethodEditFormDataService, NotificationMethodTemplateStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SaveButton,
    MonitorSelector,
    HasTemplateFeatureEnabled,
    NotificationMethodEditTemplate,
    NotificationMethodEditFormData,
    ReactiveFormsModule,
    TranslocoPipe,
    HlmSkeletonImports,
    HlmCardImports,
    HlmLabelImports,
    HlmSwitchImports,
    HlmFormFieldImports,
    HlmInputImports,
    HlmSelectImports,
    BrnSelectImports,
    HlmIconImports,
    HlmSeparatorImports,
  ],
})
export class NotificationMethodEditForm extends AbstractModelEditFormComponent<
  BackendType['CreateNotificationMethodDto'],
  BackendType['UpdateNotificationMethodDto']
> {
  private readonly notificationMethodFormDataService = inject(
    NotificationMethodEditFormDataService,
  );

  readonly notificationMethodTemplateStore = inject(NotificationMethodTemplateStore);

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
    type: ['' as BackendType['NotificationMethodData']['_type'] | '', [Validators.required]],
    titleTemplate: [undefined as string | undefined],
    bodyTemplate: [undefined as string | undefined],
    useByDefault: [false],
    monitors: [[] as BackendType['MonitorMinResponse'][]],
    testSend: [false],
  });

  isValid = injectIsValid(this.form);

  notificationMethod = input(undefined, {
    transform: (it: BackendType['NotificationMethodResponse'] | undefined) => {
      this.isCreating.set(!it);
      this.form.reset();
      if (!it) {
        return undefined;
      }

      if (it.deleted) {
        this.formDisabled = true;
      }

      this.setFormCheckerType(it.data._type);

      this.form.patchValue(
        {
          ...it,
          type: it.data._type,
        },
        {emitEvent: true},
      );

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

  readonly allMonitors = input.required<BackendType['MonitorMinResponse'][]>();
  readonly isMonitorsSearchPending = input.required<boolean>();
  searchMonitors = model('');

  readonly typeFilterControl = new FormControl<string>('');
  readonly typeFilter = toSignal(this.typeFilterControl.valueChanges.pipe(map((it) => it ?? '')), {
    initialValue: '',
  });

  readonly filteredTypes = computed(() => {
    const filter = this.typeFilter().trim().toLowerCase();
    return NOTIFICATION_METHOD_SENDER_DATA_TYPES.filter((it) =>
      it.value.trim().toLowerCase().includes(filter),
    );
  });

  readonly typeValue = toSignal(this.form.controls.type.valueChanges, {
    initialValue: this.form.controls.type.getRawValue(),
  });

  constructor() {
    super();

    effect(() => {
      const it = this.typeValue();
      if (it !== '') {
        this.setFormCheckerType(it);
      }
    });

    this.notificationMethodTemplateStore.loadByType(this.typeValue);

    effect(() => {
      const template = this.notificationMethodTemplateStore.template();
      if (this.isCreating() && template) {
        this.form.patchValue({
          titleTemplate: template.titleTemplate,
          bodyTemplate: template.bodyTemplate,
        });
      }
    });
  }

  override overrideRawValue(value: ReturnType<typeof this.form.getRawValue>): unknown {
    return {
      ...value,
      monitorIds: value.monitors.map((it) => it.id),
    };
  }

  private setFormCheckerType(type: BackendType['NotificationMethodData']['_type']) {
    // @ts-expect-error Sender Form Control
    this.form.setControl(
      'data',
      this.notificationMethodFormDataService.formSenderDataFactory(type),
    );

    // @ts-expect-error Sender Form Control
    this.form.controls['data'].patchValue({
      _type: type,
    });
  }

  protected readonly MONITOR_CHECKER_DATA_TYPES = MONITOR_CHECKER_DATA_TYPES;
  protected readonly NOTIFICATION_METHOD_SENDER_DATA_TYPES = NOTIFICATION_METHOD_SENDER_DATA_TYPES;
}
