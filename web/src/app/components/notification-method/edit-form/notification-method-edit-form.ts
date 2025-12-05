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

import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MatDivider} from '@angular/material/divider';
import {MatError, MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatOption, MatSelect} from '@angular/material/select';
import {MatSlideToggle} from '@angular/material/slide-toggle';

import {map} from 'rxjs';

import {TranslocoPipe} from '@jsverse/transloco';
import {NgIcon} from '@ng-icons/core';
import {typeOfArrayElement} from 'dfts-helper';
import {NgxMatSelectSearchModule} from 'ngx-mat-select-search';

import {BackendType, Database, NOTIFICATION_METHOD_SENDER_DATA_TYPES} from '@app/api';
import {AbstractModelEditFormComponent, SaveButton, injectIsValid} from '@app/form';
import {NotificationSenderDataValueLabelPipe} from '@app/pipes';
import {NotificationMethodTemplateStore} from '@app/services';

import {Placeholder} from '../../placeholder';
import {MonitorSelector} from '../monitor-selector';
import {NotificationMethodEditFormAppriseData} from './notification-method-edit-form-apprise-data';
import {NotificationMethodEditFormDataService} from './notification-method-edit-form-data.service';
import {NotificationMethodEditFormDiscordData} from './notification-method-edit-form-discord-data';
import {NotificationMethodEditFormEmailData} from './notification-method-edit-form-email-data';
import {NotificationMethodEditFormSlackData} from './notification-method-edit-form-slack-data';
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
        <div class="grid grid-cols-12 gap-2">
          <mat-form-field class="col-span-8 md:col-span-6">
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

          <mat-form-field class="col-span-4 md:col-span-3">
            <mat-label>{{ 'general.type' | transloco }}</mat-label>
            <mat-select formControlName="type">
              <mat-option class="pt-1">
                <ngx-mat-select-search [formControl]="typeFilterControl">
                  <ng-icon name="bootstrapXLg" ngxMatSelectSearchClear />
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

          <mat-slide-toggle class="col-span-6" formControlName="useByDefault">
            {{ 'notificationMethod.edit.useByDefault' | transloco }}
          </mat-slide-toggle>
        </div>

        <mat-card class="col-span-6" appearance="outlined">
          <mat-card-header>
            <mat-card-title>
              @if (_typeValue !== '') {
                {{ _typeValue | notificationSenderDataValueLabel | transloco }} -
              }
              {{ 'general.data' | transloco }}
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="h-4"></div>
            @if (_typeValue !== '') {
              @defer (when _typeValue === 'APPRISE') {
                @if (_typeValue === 'APPRISE') {
                  <pu-notification-method-edit-form-apprise-data />
                }
              }

              @defer (when _typeValue === 'DISCORD') {
                @if (_typeValue === 'DISCORD') {
                  <pu-notification-method-edit-form-discord-data />
                }
              }

              @defer (when _typeValue === 'EMAIL') {
                @if (_typeValue === 'EMAIL') {
                  <pu-notification-method-edit-form-email-data />
                }
              }

              @defer (when _typeValue === 'SLACK') {
                @if (_typeValue === 'SLACK') {
                  <pu-notification-method-edit-form-slack-data />
                }
              }
            } @else {
              <span>{{ 'notificationMethod.edit.selectTypeToContinue' | transloco }}</span>
            }
          </mat-card-content>
        </mat-card>

        <mat-card class="col-span-6" appearance="outlined">
          <mat-card-content>
            <div class="h-4"></div>
            <pu-monitor-selector
              [(searchMonitor)]="searchMonitors"
              [monitors]="allMonitors()"
              [isPending]="isMonitorsSearchPending()"
              formControlName="monitors" />
          </mat-card-content>
        </mat-card>

        <div class="col-span-6 flex gap-4">
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
        <mat-card appearance="outlined">
          <mat-card-header>
            <mat-card-title>
              <h3 class="text-2xl">{{ 'general.template' | transloco }}</h3>
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="h-4"></div>
            <div class="flex flex-col gap-10">
              @if (_typeValue === '') {
                <span>{{ 'notificationMethod.edit.selectTypeToContinue' | transloco }}</span>
              }
              @if (notificationMethodTemplateStore.isPending()) {
                <pu-placeholder class="h-48 w-full" />
                <pu-placeholder class="h-24 w-full" />
                <pu-placeholder class="h-48 w-full" />
                <pu-placeholder class="h-24 w-full" />
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

                    <mat-divider />
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
          </mat-card-content>
        </mat-card>
      </div>
    </form>
  `,
  selector: 'pu-notification-method-edit-form',
  providers: [NotificationMethodEditFormDataService, NotificationMethodTemplateStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TranslocoPipe,
    MatFormField,
    MatInput,
    MatLabel,
    MatSelect,
    MatOption,
    MatSlideToggle,
    SaveButton,
    NotificationMethodEditFormEmailData,
    NotificationMethodEditFormDiscordData,
    NotificationMethodEditTemplate,
    MatDivider,
    MatError,
    MatCard,
    MatCardTitle,
    MatCardHeader,
    MatCardContent,
    NotificationSenderDataValueLabelPipe,
    NgxMatSelectSearchModule,
    NgIcon,
    NotificationMethodEditFormSlackData,
    Placeholder,
    NotificationMethodEditFormAppriseData,
    MonitorSelector,
    HasTemplateFeatureEnabled,
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
}
