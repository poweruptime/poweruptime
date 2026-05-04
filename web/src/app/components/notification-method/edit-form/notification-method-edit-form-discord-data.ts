import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmFieldImports} from '@spartan-ng/helm/field';
import {HlmInputImports} from '@spartan-ng/helm/input';
import {HlmLabelImports} from '@spartan-ng/helm/label';
import {TranslocoMarkupComponent} from 'dfx-transloco-markup';

import {NotificationMethodEditFormDataService} from './notification-method-edit-form-data.service';

@Component({
  template: `
    <div class="grid gap-4" [formGroup]="discordDataFormGroup">
      <hlm-field>
        <label hlmLabel for="url">{{ 'notificationMethod.edit.discord.url' | transloco }}</label>
        <input id="url" hlmInput formControlName="url" type="url" />

        @let urlErrors = discordDataFormGroup.controls.url.errors;
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
        <label hlmLabel for="displayName">
          {{ 'notificationMethod.edit.discord.displayName' | transloco }}
        </label>
        <input id="displayName" hlmInput formControlName="displayName" type="text" />

        @let displayNameErrors = discordDataFormGroup.controls.displayName.errors;
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
        <!-- t(notificationMethod.edit.discord.urlHelp) -->
        <transloco
          [params]="{
            webhookHelpUrl:
              'https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks',
          }"
          key="notificationMethod.edit.discord.urlHelp" />
      </p>
    </div>
  `,
  selector: 'pu-notification-method-edit-form-discord-data',
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
export class NotificationMethodEditFormDiscordData {
  discordDataFormGroup = inject(NotificationMethodEditFormDataService).discordDataFormGroup;
}
