import {ChangeDetectionStrategy, Component, inject, input} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {ReactiveFormsModule, Validators} from '@angular/forms';
import {MatDivider} from '@angular/material/divider';
import {MatError, MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatOption, MatSelect} from '@angular/material/select';
import {MatSlideToggle} from '@angular/material/slide-toggle';

import {TranslocoPipe} from '@jsverse/transloco';
import {DfxLowerCaseExceptFirstLettersPipe} from 'dfx-helper';

import {BackendType, Database} from '@app/api';
import {AbstractModelEditFormComponent, SaveButton, injectIsValid} from '@app/form';

import {NotificationMethodEditFormDataService} from './notification-method-edit-form-data.service';
import {NotificationMethodEditFormDiscordData} from './notification-method-edit-form-discord-data';
import {NotificationMethodEditFormEmailData} from './notification-method-edit-form-email-data';
import {NotificationMethodEditTemplate} from './notification-method-edit-template';

@Component({
  template: `
    <form class="flex flex-col gap-3" id="form" #formRef [formGroup]="form" (ngSubmit)="submit()">
      <div class="flex gap-16">
        <div class="flex grow flex-col gap-4">
          <div class="flex flex-col gap-2">
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
                  <mat-option value="EMAIL">Email</mat-option>
                  <mat-option value="DISCORD">Discord</mat-option>
                </mat-select>

                @let typeErrors = form.controls.type.errors;
                @if (typeErrors?.['required']) {
                  <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
                }
              </mat-form-field>
            </div>

            <mat-slide-toggle formControlName="useByDefault">
              {{ 'notificationMethod.edit.useByDefault' | transloco }}
            </mat-slide-toggle>
          </div>

          @let typeValue = form.controls.type.getRawValue();

          <h2 class="mb-2 mt-6 text-2xl">
            @if (typeValue !== '') {
              {{ typeValue | s_lowerCaseAllExceptFirstLetter }} -
            }
            {{ 'general.data' | transloco }}
          </h2>

          @if (form.controls.type.getRawValue() !== '') {
            @let type = form.controls.type.getRawValue();
            @defer (when type === 'EMAIL') {
              @if (type === 'EMAIL') {
                <pu-notification-method-edit-form-email-data />
              }
            }

            @defer (when type === 'DISCORD') {
              @if (type === 'DISCORD') {
                <pu-notification-method-edit-form-discord-data />
              }
            }
          } @else {
            <span>{{ 'notificationMethod.edit.selectTypeToContinue' | transloco }}</span>
          }
        </div>

        @if (!isCreating()) {
          <div style="border-left:1px solid #FFF;height:700px"></div>

          <div class="flex grow flex-col gap-10">
            <pu-notification-method-edit-template
              [label]="'notificationMethod.edit.titleTemplate' | transloco"
              formControlName="titleTemplate" />

            <mat-divider />

            <pu-notification-method-edit-template
              [label]="'notificationMethod.edit.body' | transloco"
              formControlName="bodyTemplate" />
          </div>
        } @else {
          <div class="flex grow"></div>
        }
      </div>

      <pu-save-button [valid]="isValid()" />
    </form>
  `,
  selector: 'pu-notification-method-edit-form',
  providers: [NotificationMethodEditFormDataService],
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
    DfxLowerCaseExceptFirstLettersPipe,
  ],
})
export class NotificationMethodEditForm extends AbstractModelEditFormComponent<
  BackendType['CreateNotificationMethodDto'],
  BackendType['UpdateNotificationMethodDto']
> {
  private readonly notificationMethodFormDataService = inject(
    NotificationMethodEditFormDataService,
  );

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
    type: ['' as BackendType['NotificationSenderData']['_type'] | '', [Validators.required]],
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

  constructor() {
    super();

    this.form.controls.type.valueChanges.pipe(takeUntilDestroyed()).subscribe((it) => {
      if (it !== '') {
        this.setFormCheckerType(it);
      }
    });
  }

  private setFormCheckerType(type: BackendType['NotificationSenderData']['_type']) {
    // @ts-expect-error Sender Form Control
    this.form.setControl('sender', this.notificationMethodFormDataService.formCheckerFactory(type));

    // @ts-expect-error Sender Form Control
    this.form.controls['sender'].patchValue({
      _type: type,
    });
  }
}
