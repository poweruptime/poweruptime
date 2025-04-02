import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {MatError, MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';

import {TranslocoPipe} from '@jsverse/transloco';

import {NotificationMethodEditFormDataService} from './notification-method-edit-form-data.service';

@Component({
  template: `
    <div class="flex flex-col gap-6" [formGroup]="slackDataFormGroup">
      <div class="flex flex-col">
        <mat-form-field>
          <mat-label>{{ 'notificationMethod.edit.discord.url' | transloco }}</mat-label>
          <input matInput type="text" formControlName="url" />

          @let urlErrors = slackDataFormGroup.controls.url.errors;
          @if (urlErrors?.['required']) {
            <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
          }
          @if (urlErrors?.['minlength']; as minlength) {
            <mat-error>{{ 'form.validation.minlength' | transloco: minlength }}</mat-error>
          }
          @if (urlErrors?.['maxlength']; as maxlength) {
            <mat-error>{{ 'form.validation.maxlength' | transloco: maxlength }}</mat-error>
          }
          @if (urlErrors?.['pattern']) {
            <mat-error>{{ 'form.validation.url' | transloco }}</mat-error>
          }
        </mat-form-field>

        <small>{{ 'notificationMethod.edit.discord.urlHelp' | transloco }}</small>
      </div>

      <mat-form-field>
        <mat-label>{{ 'notificationMethod.edit.discord.displayName' | transloco }}</mat-label>
        <input matInput formControlName="displayName" />

        @let displayNameErrors = slackDataFormGroup.controls.displayName.errors;
        @if (displayNameErrors?.['minlength']; as minlength) {
          <mat-error>{{ 'form.validation.minlength' | transloco: minlength }}</mat-error>
        }
        @if (displayNameErrors?.['maxlength']; as maxlength) {
          <mat-error>{{ 'form.validation.maxlength' | transloco: maxlength }}</mat-error>
        }
      </mat-form-field>
    </div>
  `,
  selector: 'pu-notification-method-edit-form-slack-data',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatFormField, MatInput, MatLabel, MatError, TranslocoPipe],
})
export class NotificationMethodEditFormSlackData {
  slackDataFormGroup = inject(NotificationMethodEditFormDataService).slackDataFormGroup;
}
