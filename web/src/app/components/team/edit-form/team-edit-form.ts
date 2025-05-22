import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {ReactiveFormsModule, Validators} from '@angular/forms';
import {MatError, MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';

import {TranslocoPipe} from '@jsverse/transloco';

import {BackendType, Database} from '@app/api';
import {AbstractModelEditFormComponent, SaveButton, injectIsValid} from '@app/form';

@Component({
  template: `
    @let valid = isValid();

    <form class="grid" id="form" #formRef [formGroup]="form" (ngSubmit)="submit()">
      <div>
        <mat-form-field class="w-full">
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
      </div>

      <pu-save-button [valid]="valid" />
    </form>
  `,
  selector: 'pu-team-edit-form',
  imports: [
    ReactiveFormsModule,
    TranslocoPipe,
    MatFormField,
    MatInput,
    MatLabel,
    SaveButton,
    MatError,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamEditForm extends AbstractModelEditFormComponent<
  BackendType['CreateTeamDto'],
  BackendType['UpdateTeamDto']
> {
  override form = this.fb.nonNullable.group({
    id: [undefined as string | undefined],
    name: [
      '',
      [
        Validators.required,
        Validators.minLength(Database.MIN_NAME_LENGTH),
        Validators.maxLength(Database.MAX_NAME_LENGTH),
      ],
    ],
  });

  isValid = injectIsValid(this.form);

  team = input(undefined, {
    transform: (it: BackendType['TeamResponse'] | undefined) => {
      this.isCreating.set(!it);
      if (!it) {
        return undefined;
      }

      if (it.deleted) {
        this.formDisabled = true;
      }

      this.form.patchValue(it, {emitEvent: true});

      return it;
    },
  });
}
