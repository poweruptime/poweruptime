import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmBadgeImports} from '@spartan-ng/helm/badge';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmFieldImports} from '@spartan-ng/helm/field';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmInputImports} from '@spartan-ng/helm/input';
import {HlmInputGroupImports} from '@spartan-ng/helm/input-group';
import {HlmLabelImports} from '@spartan-ng/helm/label';
import {HlmSelectImports} from '@spartan-ng/helm/select';
import {HlmSwitchImports} from '@spartan-ng/helm/switch';
import {HlmTooltipImports} from '@spartan-ng/helm/tooltip';

import {Database} from '@app/api';
import {PasswordShowButton} from '@app/form';
import {chipInputAdd, chipInputRemove} from '@app/util';

import {NotificationMethodEditFormDataService} from './notification-method-edit-form-data.service';

@Component({
  template: `
    <div class="grid grid-cols-2 gap-4" [formGroup]="emailDataFormGroup">
      <div class="col-span-2 grid gap-2">
        <div class="flex items-end gap-2">
          <form
            class="w-full space-y-2"
            id="toForm"
            [formGroup]="toForm"
            (ngSubmit)="chipInputAdd(emailDataFormGroup.controls.to, toForm.controls.to)">
            <hlm-field class="w-full">
              <label for="to" hlmFieldLabel>
                {{ 'general.to' | transloco }}
              </label>
              <div hlmInputGroup>
                <input
                  id="to"
                  [placeholder]="'notificationMethod.edit.email.to.new' | transloco"
                  hlmInputGroupInput
                  formControlName="to"
                  type="email" />
                <div hlmInputGroupAddon>
                  <ng-icon name="lucideMail" />
                </div>
              </div>
            </hlm-field>
          </form>
          <button
            [disabled]="toForm.invalid"
            [hlmTooltip]="'notificationMethod.edit.email.to.enter' | transloco"
            hlmBtn
            variant="outline"
            form="toForm"
            type="submit">
            <ng-icon hlm name="lucideCirclePlus" size="sm" />
          </button>
        </div>

        <div class="flex flex-wrap gap-2">
          @for (email of emailDataFormGroup.controls.to.getRawValue(); track email) {
            <span hlmBadge variant="secondary">
              <div class="flex items-center justify-center gap-1">
                <span>{{ email }}</span>
                <button
                  [attr.aria-label]="
                    'notificationMethod.edit.email.to.remove' | transloco: {email: email}
                  "
                  (click)="chipInputRemove(emailDataFormGroup.controls.to, email)"
                  hlmBtn
                  variant="ghost"
                  size="icon-xs"
                  type="button">
                  <ng-icon hlm name="lucideX" size="xs" />
                </button>
              </div>
            </span>
          }
        </div>
        @let toErrors = emailDataFormGroup.controls.to.errors;
        @if (toErrors?.['required']) {
          <hlm-field-error>{{ 'form.validation.required' | transloco }}</hlm-field-error>
        }
        @if (toErrors?.['minLengthArrayItem']; as minlength) {
          <hlm-field-error>
            {{ 'form.validation.minlength' | transloco: minlength }}
          </hlm-field-error>
        }
        @if (toErrors?.['maxLengthArrayItem']; as maxlength) {
          <hlm-field-error>
            {{ 'form.validation.maxlength' | transloco: maxlength }}
          </hlm-field-error>
        }
      </div>

      <div class="col-span-2 grid grid-cols-6 gap-4">
        <hlm-field class="col-span-4">
          <label hlmFieldLabel for="host">{{ 'general.host' | transloco }}</label>
          <input id="host" hlmInput formControlName="host" type="text" placeholder="google.com" />
          @let hostErrors = emailDataFormGroup.controls.host.errors;

          @if (hostErrors?.['required']) {
            <hlm-field-error>{{ 'form.validation.required' | transloco }}</hlm-field-error>
          }
          @if (hostErrors?.['minlength']; as minlength) {
            <hlm-field-error>
              {{ 'form.validation.minlength' | transloco: minlength }}
            </hlm-field-error>
          }
          @if (hostErrors?.['maxlength']; as maxlength) {
            <hlm-field-error>
              {{ 'form.validation.maxlength' | transloco: maxlength }}
            </hlm-field-error>
          }
          @if (hostErrors?.['pattern']) {
            <hlm-field-error>{{ 'form.validation.domain' | transloco }}</hlm-field-error>
          }
        </hlm-field>
        <hlm-field class="col-span-2">
          <label hlmFieldLabel for="port">{{ 'general.port' | transloco }}</label>

          <input id="port" hlmInput formControlName="port" step="1" type="number" />

          @let portErrors = emailDataFormGroup.controls.port.errors;
          @if (portErrors?.['required']) {
            <hlm-field-error>{{ 'form.validation.required' | transloco }}</hlm-field-error>
          }
          @if (portErrors?.['min']; as min) {
            <hlm-field-error>{{ 'form.validation.min' | transloco: min }}</hlm-field-error>
          }
          @if (portErrors?.['max']; as max) {
            <hlm-field-error>{{ 'form.validation.max' | transloco: max }}</hlm-field-error>
          }
          @if (portErrors?.['pattern']) {
            <hlm-field-error>{{ 'form.validation.integer' | transloco }}</hlm-field-error>
          }
        </hlm-field>
      </div>

      <div class="col-span-2 mb-5 grid items-center gap-4 xl:grid-cols-6">
        <hlm-field class="col-span-4">
          <label hlmFieldLabel for="security">{{ 'general.security' | transloco }}</label>
          <hlm-select id="security" formControlName="security">
            <hlm-select-trigger class="w-full">
              <hlm-select-value [placeholder]="'general.security' | transloco" />
            </hlm-select-trigger>
            <hlm-select-content *hlmSelectPortal>
              <hlm-select-group>
                <hlm-select-item value="NONE_STARTTLS">None / STARTTLS (25, 587)</hlm-select-item>
                <hlm-select-item value="TLS">TLS (465)</hlm-select-item>
              </hlm-select-group>
            </hlm-select-content>
          </hlm-select>
        </hlm-field>

        <label class="col-span-2 flex items-center" hlmLabel for="ignoreTLSErrors">
          <hlm-switch class="mr-2" inputId="ignoreTLSErrors" formControlName="ignoreTLSErrors" />
          {{ 'notificationMethod.edit.email.ignoreTLSErrors' | transloco }}
        </label>
      </div>

      <hlm-field class="col-span-1">
        <label hlmFieldLabel for="username">Username</label>
        <div hlmInputGroup>
          <input id="username" hlmInputGroupInput formControlName="username" />
          <div hlmInputGroupAddon>
            <ng-icon name="lucideUser" />
          </div>
        </div>
        @let usernameErrors = emailDataFormGroup.controls.username.errors;
        @if (usernameErrors?.['maxlength']; as maxlength) {
          <hlm-field-error>
            {{ 'form.validation.maxlength' | transloco: maxlength }}
          </hlm-field-error>
        }
      </hlm-field>

      <hlm-field class="col-span-1">
        <label hlmFieldLabel for="password">{{ 'general.password' | transloco }}</label>
        <div hlmInputGroup>
          <input
            id="password"
            [type]="showPasswordButton.type()"
            [placeholder]="showPasswordButton.placeholder()"
            hlmInputGroupInput
            formControlName="password" />
          <div hlmInputGroupAddon>
            <ng-icon name="lucideKey" />
          </div>
          <pu-password-show-button #showPasswordButton hlmInputGroupAddon align="inline-end" />
        </div>
        @let passwordErrors = emailDataFormGroup.controls.password.errors;
        @if (passwordErrors?.['maxlength']; as maxlength) {
          <hlm-field-error>
            {{ 'form.validation.maxlength' | transloco: maxlength }}
          </hlm-field-error>
        }
      </hlm-field>

      <div class="col-span-2 grid gap-2">
        <div class="flex items-end gap-2">
          <form
            class="w-full space-y-2"
            id="ccForm"
            [formGroup]="ccForm"
            (ngSubmit)="chipInputAdd(emailDataFormGroup.controls.cc, ccForm.controls.cc)">
            <hlm-field class="w-full">
              <label for="cc" hlmFieldLabel>CC</label>
              <div hlmInputGroup>
                <input
                  id="cc"
                  [placeholder]="'notificationMethod.edit.email.cc.new' | transloco"
                  hlmInputGroupInput
                  formControlName="cc"
                  type="email" />
                <div hlmInputGroupAddon>
                  <ng-icon name="lucideMail" />
                </div>
              </div>
            </hlm-field>
          </form>
          <button
            [disabled]="ccForm.invalid"
            [hlmTooltip]="'notificationMethod.edit.email.cc.enter' | transloco"
            hlmBtn
            variant="outline"
            form="ccForm"
            type="submit">
            <ng-icon hlm name="lucideCirclePlus" size="sm" />
          </button>
        </div>

        <div class="flex flex-wrap gap-2">
          @for (email of emailDataFormGroup.controls.cc.getRawValue(); track email) {
            <span hlmBadge variant="secondary">
              <div class="flex items-center justify-center gap-1">
                <span>{{ email }}</span>
                <button
                  [attr.aria-label]="
                    'notificationMethod.edit.email.cc.remove' | transloco: {email: email}
                  "
                  (click)="chipInputRemove(emailDataFormGroup.controls.cc, email)"
                  hlmBtn
                  variant="ghost"
                  size="icon-xs"
                  type="button">
                  <ng-icon hlm name="lucideX" size="xs" />
                </button>
              </div>
            </span>
          }
        </div>
        @let ccErrors = emailDataFormGroup.controls.cc.errors;
        @if (ccErrors?.['minLengthArrayItem']; as minlength) {
          <hlm-field-error>
            {{ 'form.validation.minlength' | transloco: minlength }}
          </hlm-field-error>
        }
        @if (ccErrors?.['maxLengthArrayItem']; as maxlength) {
          <hlm-field-error>
            {{ 'form.validation.maxlength' | transloco: maxlength }}
          </hlm-field-error>
        }
      </div>

      <div class="col-span-2 grid gap-2">
        <div class="flex items-end gap-2">
          <form
            class="w-full space-y-2"
            id="bccForm"
            [formGroup]="bccForm"
            (ngSubmit)="chipInputAdd(emailDataFormGroup.controls.bcc, bccForm.controls.bcc)">
            <hlm-field class="w-full">
              <label for="bcc" hlmFieldLabel>BCC</label>
              <div hlmInputGroup>
                <input
                  id="bcc"
                  [placeholder]="'notificationMethod.edit.email.bcc.new' | transloco"
                  hlmInputGroupInput
                  formControlName="bcc"
                  type="email" />
                <div hlmInputGroupAddon>
                  <ng-icon name="lucideMail" />
                </div>
              </div>
            </hlm-field>
          </form>
          <button
            [disabled]="bccForm.invalid"
            [hlmTooltip]="'notificationMethod.edit.email.bcc.enter' | transloco"
            hlmBtn
            variant="outline"
            form="bccForm"
            type="submit">
            <ng-icon hlm name="lucideCirclePlus" size="sm" />
          </button>
        </div>

        <div class="flex flex-wrap gap-2">
          @for (email of emailDataFormGroup.controls.bcc.getRawValue(); track email) {
            <span hlmBadge variant="secondary">
              <div class="flex items-center justify-center gap-1">
                <span>{{ email }}</span>
                <button
                  [attr.aria-label]="
                    'notificationMethod.edit.email.bcc.remove' | transloco: {email: email}
                  "
                  (click)="chipInputRemove(emailDataFormGroup.controls.bcc, email)"
                  hlmBtn
                  variant="ghost"
                  size="icon-xs"
                  type="button">
                  <ng-icon hlm name="lucideX" size="xs" />
                </button>
              </div>
            </span>
          }
        </div>
        @let bccErrors = emailDataFormGroup.controls.bcc.errors;
        @if (bccErrors?.['minLengthArrayItem']; as minlength) {
          <hlm-field-error>
            {{ 'form.validation.minlength' | transloco: minlength }}
          </hlm-field-error>
        }
        @if (bccErrors?.['maxLengthArrayItem']; as maxlength) {
          <hlm-field-error>
            {{ 'form.validation.maxlength' | transloco: maxlength }}
          </hlm-field-error>
        }
      </div>
    </div>
  `,
  selector: 'pu-notification-method-edit-form-email-data',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PasswordShowButton,
    ReactiveFormsModule,
    TranslocoPipe,
    HlmLabelImports,
    HlmSwitchImports,
    HlmBadgeImports,
    HlmButtonImports,
    HlmLabelImports,
    HlmInputImports,
    HlmInputGroupImports,
    HlmIconImports,
    HlmTooltipImports,
    HlmSelectImports,
    HlmFieldImports,
  ],
})
export class NotificationMethodEditFormEmailData {
  protected readonly chipInputAdd = chipInputAdd;
  protected readonly chipInputRemove = chipInputRemove;

  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly emailDataFormGroup = inject(NotificationMethodEditFormDataService)
    .emailDataFormGroup;

  private readonly emailFormControl = [
    '',
    [
      Validators.required,
      Validators.email,
      Validators.minLength(Database.MIN_MAIL_LENGTH),
      Validators.maxLength(Database.MAX_MAIL_LENGTH),
    ],
  ];

  protected readonly toForm = this.fb.group({
    to: this.emailFormControl,
  });

  protected readonly ccForm = this.fb.group({
    cc: this.emailFormControl,
  });

  protected readonly bccForm = this.fb.group({
    bcc: this.emailFormControl,
  });
}
