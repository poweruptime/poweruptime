import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {MatError, MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';

import {TranslocoPipe} from '@jsverse/transloco';
import {TranslocoMarkupComponent} from 'ngx-transloco-markup';

import {NotificationMethodEditFormDataService} from './notification-method-edit-form-data.service';

@Component({
  template: `
    <div class="flex flex-col gap-6" [formGroup]="appriseDataFormGroup">
      <div class="flex flex-col">
        <mat-form-field>
          <mat-label>{{ 'notificationMethod.edit.apprise.url' | transloco }}</mat-label>
          <input matInput type="text" formControlName="url" />

          @let urlErrors = appriseDataFormGroup.controls.url.errors;
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

        <small>
          <!-- t(notificationMethod.edit.apprise.urlHelp) -->
          <transloco
            [params]="{
              webhookHelpUrl: 'https://github.com/caronc/apprise/wiki',
            }"
            key="notificationMethod.edit.apprise.urlHelp" />
        </small>
      </div>
    </div>
  `,
  selector: 'pu-notification-method-edit-form-apprise-data',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatInput,
    MatLabel,
    MatError,
    TranslocoPipe,
    TranslocoMarkupComponent,
  ],
})
export class NotificationMethodEditFormAppriseData {
  appriseDataFormGroup = inject(NotificationMethodEditFormDataService).appriseDataFormGroup;
}
