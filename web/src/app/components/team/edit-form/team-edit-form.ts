import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {ReactiveFormsModule, Validators} from '@angular/forms';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmFormFieldImports} from '@spartan-ng/helm/form-field';
import {HlmInputImports} from '@spartan-ng/helm/input';
import {HlmLabelImports} from '@spartan-ng/helm/label';

import {BackendType, Database} from '@app/api';
import {AbstractModelEditFormComponent, SaveButton, injectIsValid} from '@app/form';

@Component({
  template: `
    @let valid = isValid();

    <form class="grid gap-4" id="form" #formRef [formGroup]="form" (ngSubmit)="submit()">
      <hlm-form-field>
        <label hlmLabel for="name">
          {{ 'general.name' | transloco }}
        </label>
        <input
          id="name"
          autocomplete="off"
          hlmInput
          formControlName="name"
          type="text"
          placeholder="Team #1" />
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

      <pu-save-button [valid]="valid" />
    </form>
  `,
  selector: 'pu-team-edit-form',
  imports: [
    SaveButton,
    ReactiveFormsModule,
    TranslocoPipe,
    HlmFormFieldImports,
    HlmInputImports,
    HlmLabelImports,
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
