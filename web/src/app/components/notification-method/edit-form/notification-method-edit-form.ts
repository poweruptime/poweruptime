import {ChangeDetectionStrategy, Component, computed, effect, inject, input} from '@angular/core';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';
import {FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MatDivider} from '@angular/material/divider';
import {MatError, MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatOption, MatSelect} from '@angular/material/select';
import {MatSlideToggle} from '@angular/material/slide-toggle';

import {filter, map} from 'rxjs';

import {TranslocoPipe} from '@jsverse/transloco';
import {BiComponent} from 'dfx-bootstrap-icons';
import {NgxMatSelectSearchModule} from 'ngx-mat-select-search';

import {BackendType, Database, NOTIFICATION_METHOD_SENDER_DATA_TYPES} from '@app/api';
import {AbstractModelEditFormComponent, SaveButton, injectIsValid} from '@app/form';
import {NotificationSenderDataValueLabelPipe} from '@app/pipes';

import {NotificationMethodTemplateStore} from '../../../services';
import {AlertDirective} from '../../alert.directive';
import {Placeholder} from '../../placeholder';
import {NotificationMethodEditFormAppriseData} from './notification-method-edit-form-apprise-data';
import {NotificationMethodEditFormDataService} from './notification-method-edit-form-data.service';
import {NotificationMethodEditFormDiscordData} from './notification-method-edit-form-discord-data';
import {NotificationMethodEditFormEmailData} from './notification-method-edit-form-email-data';
import {NotificationMethodEditFormSlackData} from './notification-method-edit-form-slack-data';
import {NotificationMethodEditTemplate} from './notification-method-edit-template';

@Component({
  template: `
    <form
      class="mb-6 grid gap-6 lg:grid-cols-2"
      id="form"
      #formRef
      [formGroup]="form"
      (ngSubmit)="submit()">
      @let _typeValue = typeValue();

      <div class="grid-cols-6">
        <div class="grid gap-2">
          <mat-form-field class="col-span-4">
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

          <mat-form-field class="md:col-span-2">
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

          <mat-slide-toggle class="col-span-6" formControlName="useByDefault">
            {{ 'notificationMethod.edit.useByDefault' | transloco }}
          </mat-slide-toggle>

          <mat-card class="col-span-6 mt-8" appearance="outlined">
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
        </div>
      </div>

      <div>
        <mat-card appearance="outlined">
          <mat-card-header>
            <mat-card-title>
              {{ 'general.template' | transloco }}
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
                @if (notificationMethodTemplateStore.template(); as template) {
                  @if (template.features?.includes('TITLE')) {
                    <pu-notification-method-edit-template
                      [label]="'notificationMethod.edit.titleTemplate' | transloco"
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
                    formControlName="bodyTemplate" />
                }
              }
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <pu-save-button [valid]="isValid()" />
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
    BiComponent,
    NotificationMethodEditFormSlackData,
    Placeholder,
    NotificationMethodEditFormAppriseData,
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

      this.setFormCheckerType(it.sender._type);

      this.form.patchValue(
        {
          ...it,
          type: it.sender._type,
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

  resetTitleTemplate(titleTemplate: string) {
    this.form.patchValue({
      titleTemplate,
    });
  }

  resetBodyTemplate(bodyTemplate: string) {
    this.form.patchValue({
      bodyTemplate,
    });
  }

  private setFormCheckerType(type: BackendType['NotificationMethodData']['_type']) {
    // @ts-expect-error Sender Form Control
    this.form.setControl(
      'sender',
      this.notificationMethodFormDataService.formSenderDataFactory(type),
    );

    // @ts-expect-error Sender Form Control
    this.form.controls['sender'].patchValue({
      _type: type,
    });
  }
}
