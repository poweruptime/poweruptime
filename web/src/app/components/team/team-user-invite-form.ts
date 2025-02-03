import {ChangeDetectionStrategy, Component} from '@angular/core';
import {ReactiveFormsModule, Validators} from '@angular/forms';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatOption, MatSelect} from '@angular/material/select';

import {TranslocoPipe} from '@jsverse/transloco';

import {BackendType} from '@app/api';
import {AbstractModelEditFormComponent, SaveButton, injectIsValid} from '@app/form';

@Component({
  template: `
    <form class="flex flex-col gap-2" id="form" #formRef [formGroup]="form" (ngSubmit)="submit()">
      <mat-form-field>
        <mat-label>{{ 'Email' | transloco }}</mat-label>
        <input matInput formControlName="email" />
      </mat-form-field>

      <mat-form-field>
        <mat-label>{{ 'Role' | transloco }}</mat-label>
        <mat-select formControlName="role">
          <mat-option value="ADMIN">Admin</mat-option>
          <mat-option value="MEMBER">Member</mat-option>
        </mat-select>
      </mat-form-field>

      <pu-save-button [valid]="isValid()" />
    </form>
  `,
  selector: 'pu-team-user-invite-form',
  imports: [
    ReactiveFormsModule,
    TranslocoPipe,
    MatFormField,
    MatInput,
    MatLabel,
    SaveButton,
    MatSelect,
    MatOption,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamUserInviteForm extends AbstractModelEditFormComponent<
  BackendType['InviteTeamUserDto'],
  BackendType['InviteTeamUserDto']
> {
  override form = this.fb.nonNullable.group({
    role: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
  });

  isValid = injectIsValid(this.form);
}
