import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmInputImports} from '@spartan-ng/helm/input';
import {HlmLabelImports} from '@spartan-ng/helm/label';
import {TranslocoMarkupComponent} from 'dfx-transloco-markup';

import {NotificationMethodEditFormDataService} from './notification-method-edit-form-data.service';
import {HlmFieldImports} from '@spartan-ng/helm/field';

@Component({
  template: `
    <div class="grid gap-4" [formGroup]="appriseDataFormGroup">
      <hlm-field>
        <label hlmLabel for="url">{{ 'notificationMethod.edit.apprise.url' | transloco }}</label>
        <input id="url" hlmInput formControlName="url" type="url" />

        @let urlErrors = appriseDataFormGroup.controls.url.errors;
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

      <p hlmFieldDescription>
        <!-- t(notificationMethod.edit.apprise.urlHelp) -->
        <transloco
          [params]="{
            webhookHelpUrl: 'https://github.com/caronc/apprise/wiki',
          }"
          key="notificationMethod.edit.apprise.urlHelp" />
      </p>
    </div>
  `,
  selector: 'pu-notification-method-edit-form-apprise-data',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TranslocoPipe,
    TranslocoMarkupComponent,
    HlmInputImports,
    HlmLabelImports,
    HlmFieldImports,
  ],
})
export class NotificationMethodEditFormAppriseData {
  appriseDataFormGroup = inject(NotificationMethodEditFormDataService).appriseDataFormGroup;
}
