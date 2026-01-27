import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmFormFieldImports} from '@spartan-ng/helm/form-field';
import {HlmInputImports} from '@spartan-ng/helm/input';
import {HlmLabelImports} from '@spartan-ng/helm/label';
import {TranslocoMarkupComponent} from 'dfx-transloco-markup';

import {NotificationMethodEditFormDataService} from './notification-method-edit-form-data.service';

@Component({
  template: `
    <div class="grid gap-4" [formGroup]="slackDataFormGroup">
      <hlm-form-field>
        <label hlmLabel for="url">{{ 'notificationMethod.edit.slack.url' | transloco }}</label>
        <input id="url" hlmInput formControlName="url" type="url" />

        @let urlErrors = slackDataFormGroup.controls.url.errors;
        @if (urlErrors?.['required']) {
          <hlm-error>{{ 'form.validation.required' | transloco }}</hlm-error>
        }
        @if (urlErrors?.['minlength']; as minlength) {
          <hlm-error>{{ 'form.validation.minlength' | transloco: minlength }}</hlm-error>
        }
        @if (urlErrors?.['maxlength']; as maxlength) {
          <hlm-error>{{ 'form.validation.maxlength' | transloco: maxlength }}</hlm-error>
        }
        @if (urlErrors?.['pattern']) {
          <hlm-error>{{ 'form.validation.url' | transloco }}</hlm-error>
        }
      </hlm-form-field>

      <hlm-form-field>
        <label hlmLabel for="displayName">
          {{ 'notificationMethod.edit.slack.displayName' | transloco }}
        </label>
        <input id="displayName" hlmInput formControlName="displayName" type="text" />

        @let displayNameErrors = slackDataFormGroup.controls.displayName.errors;
        @if (displayNameErrors?.['minlength']; as minlength) {
          <hlm-error>{{ 'form.validation.minlength' | transloco: minlength }}</hlm-error>
        }
        @if (displayNameErrors?.['maxlength']; as maxlength) {
          <hlm-error>{{ 'form.validation.maxlength' | transloco: maxlength }}</hlm-error>
        }
      </hlm-form-field>

      <hlm-hint>
        <!-- t(notificationMethod.edit.slack.urlHelp) -->
        <transloco
          [params]="{webhookHelpUrl: 'https://api.slack.com/messaging/webhooks'}"
          key="notificationMethod.edit.slack.urlHelp" />
      </hlm-hint>
    </div>
  `,
  selector: 'pu-notification-method-edit-form-slack-data',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TranslocoPipe,
    TranslocoPipe,
    TranslocoMarkupComponent,
    HlmInputImports,
    HlmLabelImports,
    HlmFormFieldImports,
  ],
})
export class NotificationMethodEditFormSlackData {
  slackDataFormGroup = inject(NotificationMethodEditFormDataService).slackDataFormGroup;
}
