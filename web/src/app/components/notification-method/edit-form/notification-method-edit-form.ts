import {ChangeDetectionStrategy, Component, inject, input} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {ReactiveFormsModule, Validators} from '@angular/forms';
import {MatDivider} from '@angular/material/divider';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatOption, MatSelect} from '@angular/material/select';
import {MatSlideToggle} from '@angular/material/slide-toggle';

import {TranslocoPipe} from '@jsverse/transloco';

import {BackendType, Database} from '@app/api';
import {AbstractModelEditFormComponent, SaveButton, injectIsValid} from '@app/form';

import {NotificationMethodEditFormDataService} from './notification-method-edit-form-data.service';
import {NotificationMethodEditFormDiscordData} from './notification-method-edit-form-discord-data';
import {NotificationMethodEditFormEmailData} from './notification-method-edit-form-email-data';
import {NotificationMethodEditTemplate} from './notification-method-edit-template';

@Component({
  template: `
    @let valid = isValid();

    <form class="flex flex-col gap-3" id="form" #formRef [formGroup]="form" (ngSubmit)="submit()">
      <div class="flex gap-16">
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <div class="flex gap-2">
              <mat-form-field>
                <mat-label>{{ 'general.name' | transloco }}</mat-label>
                <input matInput formControlName="name" />
              </mat-form-field>

              <mat-form-field>
                <mat-label>Type</mat-label>
                <mat-select formControlName="type">
                  <mat-option value="EMAIL">Email</mat-option>
                  <mat-option value="DISCORD">Discord</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <mat-slide-toggle formControlName="useByDefault">Use by default</mat-slide-toggle>
          </div>

          <h2 class="mb-2 mt-6 text-2xl">Data</h2>

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
          }
        </div>

        <div style="border-left:1px solid #FFF;height:700px"></div>

        <div class="flex min-w-96 flex-col gap-10">
          <pu-notification-method-edit-template
            formControlName="titleTemplate"
            label="Title template" />

          <mat-divider />

          <pu-notification-method-edit-template
            formControlName="bodyTemplate"
            label="Body template" />
        </div>
      </div>

      <pu-save-button [valid]="valid" />
    </form>
  `,
  selector: 'pu-notification-method-edit-form',
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
