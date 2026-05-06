import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmFieldImports} from '@spartan-ng/helm/field';
import {HlmInputImports} from '@spartan-ng/helm/input';
import {TranslocoMarkupComponent} from 'dfx-transloco-markup';

import {NotificationMethodEditFormDataService} from './notification-method-edit-form-data.service';

@Component({
  template: `
    <div class="grid gap-4" [formGroup]="slackDataFormGroup">
      <hlm-field>
        <label hlmFieldLabel for="url">{{ 'notificationMethod.edit.slack.url' | transloco }}</label>
        <input id="url" hlmInput formControlName="url" type="url" />

        @let urlErrors = slackDataFormGroup.controls.url.errors;
        @if (urlErrors?.['required']) {
          <hlm-field-error>{{ 'form.validation.required' | transloco }}</hlm-field-error>
        }
        @if (urlErrors?.['minlength']; as minlength) {
          <hlm-field-error>
            {{ 'form.validation.minlength' | transloco: minlength }}
          </hlm-field-error>
        }
        @if (urlErrors?.['maxlength']; as maxlength) {
          <hlm-field-error>
            {{ 'form.validation.maxlength' | transloco: maxlength }}
          </hlm-field-error>
        }
        @if (urlErrors?.['pattern']) {
          <hlm-field-error>{{ 'form.validation.url' | transloco }}</hlm-field-error>
        }
      </hlm-field>

      <hlm-field>
        <label hlmFieldLabel for="displayName">
          {{ 'notificationMethod.edit.slack.displayName' | transloco }}
        </label>
        <input id="displayName" hlmInput formControlName="displayName" type="text" />

        @let displayNameErrors = slackDataFormGroup.controls.displayName.errors;
        @if (displayNameErrors?.['minlength']; as minlength) {
          <hlm-field-error>
            {{ 'form.validation.minlength' | transloco: minlength }}
          </hlm-field-error>
        }
        @if (displayNameErrors?.['maxlength']; as maxlength) {
          <hlm-field-error>
            {{ 'form.validation.maxlength' | transloco: maxlength }}
          </hlm-field-error>
        }
      </hlm-field>

      <p hlmFieldDescription>
        <!-- t(notificationMethod.edit.slack.urlHelp) -->
        <transloco
          [params]="{webhookHelpUrl: 'https://api.slack.com/messaging/webhooks'}"
          key="notificationMethod.edit.slack.urlHelp" />
      </p>
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
    HlmFieldImports,
  ],
})
export class NotificationMethodEditFormSlackData {
  slackDataFormGroup = inject(NotificationMethodEditFormDataService).slackDataFormGroup;
}
