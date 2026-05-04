import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {ReactiveFormsModule, Validators} from '@angular/forms';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmInputImports} from '@spartan-ng/helm/input';
import {HlmLabelImports} from '@spartan-ng/helm/label';

import {BackendType, Database} from '@app/api';
import {AbstractModelEditFormComponent, SaveButton, injectIsValid} from '@app/form';

import {ProfilePictureUpload} from '../../profile-picture-upload';
import {HlmFieldImports} from '@spartan-ng/helm/field';

@Component({
  template: `
    @let valid = isValid();

    <form class="grid gap-4" id="form" #formRef [formGroup]="form" (ngSubmit)="submit()">
      <div class="flex items-end gap-4">
        <pu-profile-picture-upload
          [file]="team()?.image"
          [label]="'statusPage.edit.image' | transloco"
          (fileId)="form.controls.imageId.setValue($event)" />

        <hlm-field>
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
      </div>

      <pu-save-button [valid]="valid" />
    </form>
  `,
  selector: 'pu-team-edit-form',
  imports: [
    SaveButton,
    ReactiveFormsModule,
    TranslocoPipe,
    HlmInputImports,
    HlmLabelImports,
    ProfilePictureUpload,
    HlmFieldImports,
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
    imageId: [null as string | null],
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

      this.form.patchValue(
        {
          ...it,
          imageId: it.image?.fileId,
        },
        {emitEvent: true},
      );

      return it;
    },
  });
}
