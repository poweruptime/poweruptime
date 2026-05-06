import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {FormControl, ReactiveFormsModule} from '@angular/forms';

import {CdkTextareaAutosize} from '@angular/cdk/text-field';

import {filter} from 'rxjs';

import {TranslocoPipe} from '@jsverse/transloco';
import '@spartan-ng/brain/select';
import {HlmAccordionImports} from '@spartan-ng/helm/accordion';
import {HlmAutocompleteImports} from '@spartan-ng/helm/autocomplete';
import {HlmBadgeImports} from '@spartan-ng/helm/badge';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmCardImports} from '@spartan-ng/helm/card';
import {HlmFieldImports} from '@spartan-ng/helm/field';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmInputImports} from '@spartan-ng/helm/input';
import {HlmInputGroupImports} from '@spartan-ng/helm/input-group';
import {HlmLabelImports} from '@spartan-ng/helm/label';
import {HlmSelectImports} from '@spartan-ng/helm/select';
import {HlmSeparatorImports} from '@spartan-ng/helm/separator';
import {HlmSwitchImports} from '@spartan-ng/helm/switch';
import {HlmTextareaImports} from '@spartan-ng/helm/textarea';
import {HlmTooltipImports} from '@spartan-ng/helm/tooltip';

import {Database} from '@app/api';
import {PasswordShowButton} from '@app/form';

import {chipInputRemove} from '../../../util';
import {MonitorEditFormDataCard} from './monitor-edit-form-data-card';
import {MonitorEditFormDataService} from './monitor-edit-form-data.service';

const predefinedStatusCodeRanges = [
  '100 - 199',
  '200 - 299',
  '300 - 399',
  '400 - 499',
  '500 - 599',
  '400 - 599',
];

@Component({
  template: `
    <div class="grid gap-4" [formGroup]="httpDataFormGroup">
      <pu-monitor-edit-form-data-card type="HTTP">
        <div class="grid grid-cols-8 gap-6">
          <hlm-field class="col-span-8">
            <label hlmFieldLabel for="url">
              {{ 'general.url' | transloco }}
            </label>
            <input
              id="url"
              hlmInput
              formControlName="url"
              type="url"
              placeholder="https://google.com" />
            @let urlErrors = httpDataFormGroup.controls.url.errors;
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

          <hlm-field class="col-span-8 xl:col-span-2">
            <label hlmFieldLabel for="method">{{ 'general.method' | transloco }}</label>
            <hlm-select id="method" formControlName="method">
              <hlm-select-trigger class="w-full">
                <hlm-select-value [placeholder]="'general.method' | transloco" />
              </hlm-select-trigger>
              <hlm-select-content *hlmSelectPortal>
                <hlm-select-group>
                  <hlm-select-item value="GET">GET</hlm-select-item>
                  <hlm-select-item value="POST">POST</hlm-select-item>
                  <hlm-select-item value="PUT">PUT</hlm-select-item>
                  <hlm-select-item value="PATCH">PATCH</hlm-select-item>
                  <hlm-select-item value="DELETE">DELETE</hlm-select-item>
                  <hlm-select-item value="HEAD">HEAD</hlm-select-item>
                  <hlm-select-item value="OPTIONS">OPTIONS</hlm-select-item>
                </hlm-select-group>
              </hlm-select-content>
            </hlm-select>
          </hlm-field>

          <hlm-field class="col-span-8 xl:col-span-2">
            <label hlmFieldLabel for="contentType">{{ 'general.contentType' | transloco }}</label>
            <hlm-select id="contentType" formControlName="contentType">
              <hlm-select-trigger class="w-full">
                <hlm-select-value [placeholder]="'general.contentType' | transloco" />
              </hlm-select-trigger>
              <hlm-select-content *hlmSelectPortal>
                <hlm-select-group>
                  <hlm-select-item value="JSON">JSON</hlm-select-item>
                  <hlm-select-item value="XML">XML</hlm-select-item>
                </hlm-select-group>
              </hlm-select-content>
            </hlm-select>
          </hlm-field>

          <div class="col-span-8 grid grid-cols-8 gap-4">
            <hlm-field class="col-span-8 xl:col-span-2">
              <label hlmFieldLabel for="authType">
                {{ 'monitor.edit.http.authType' | transloco }}
              </label>
              <hlm-select id="authType" formControlName="authType">
                <hlm-select-trigger class="w-full">
                  <hlm-select-value [placeholder]="'monitor.edit.http.authType' | transloco" />
                </hlm-select-trigger>
                <hlm-select-content *hlmSelectPortal>
                  <hlm-select-group>
                    <hlm-select-item [value]="undefined">None</hlm-select-item>
                    <hlm-select-item value="BASIC_AUTH">Basic auth</hlm-select-item>
                  </hlm-select-group>
                </hlm-select-content>
              </hlm-select>
            </hlm-field>

            @if (httpDataFormGroup.controls.authType.getRawValue() === 'BASIC_AUTH') {
              <hlm-field class="col-span-8 xl:col-span-3">
                <label hlmFieldLabel for="basicAuthDataUsername">
                  {{ 'general.username' | transloco }}
                </label>
                <input
                  id="basicAuthDataUsername"
                  hlmInput
                  formControlName="basicAuthDataUsername"
                  type="text" />
                @let basicAuthUsernameErrors =
                  httpDataFormGroup.controls.basicAuthDataUsername.errors;
                @if (basicAuthUsernameErrors?.['required']) {
                  <hlm-field-error>{{ 'form.validation.required' | transloco }}</hlm-field-error>
                }
                @if (basicAuthUsernameErrors?.['maxlength']; as maxlength) {
                  <hlm-field-error>
                    {{ 'form.validation.maxlength' | transloco: maxlength }}
                  </hlm-field-error>
                }
              </hlm-field>

              <hlm-field class="col-span-8 xl:col-span-3">
                <label hlmFieldLabel for="basicAuthDataPassword">
                  {{ 'general.password' | transloco }}
                </label>

                <div hlmInputGroup>
                  <input
                    id="basicAuthDataPassword"
                    [type]="showPasswordButton.type()"
                    [placeholder]="showPasswordButton.placeholder()"
                    hlmInputGroupInput
                    formControlName="basicAuthDataPassword" />
                  <div hlmInputGroupAddon>
                    <ng-icon name="lucideKey" />
                  </div>
                  <pu-password-show-button
                    #showPasswordButton
                    hlmInputGroupAddon
                    align="inline-end" />
                </div>
                @let basicAuthPasswordErrors =
                  httpDataFormGroup.controls.basicAuthDataPassword.errors;
                @if (basicAuthPasswordErrors?.['required']) {
                  <hlm-field-error>{{ 'form.validation.required' | transloco }}</hlm-field-error>
                }
                @if (basicAuthPasswordErrors?.['maxlength']; as maxlength) {
                  <hlm-field-error>
                    {{ 'form.validation.maxlength' | transloco: maxlength }}
                  </hlm-field-error>
                }
              </hlm-field>
            }
          </div>

          <hlm-separator class="col-span-8" />

          <div class="col-span-8">
            <h4 class="text-sm font-medium">Response Handling</h4>
          </div>

          <div class="col-span-8 grid gap-2 xl:col-span-5">
            <div class="inline-flex items-end gap-2">
              <div class="space-y-2">
                <label for="allowedStatusCodeRange" hlmLabel>
                  {{ 'monitor.edit.http.allowedStatusCodeRanges.title' | transloco }}
                </label>
                <hlm-autocomplete-search
                  [(value)]="statusCodeRangeInput"
                  [(search)]="statusCodeRangeSearch"
                  [restoreFocus]="false">
                  <hlm-autocomplete-input
                    id="allowedStatusCodeRange"
                    [placeholder]="'monitor.edit.http.allowedStatusCodeRanges.new' | transloco"
                    (keydown.enter)="
                      select(
                        httpDataFormGroup.controls.allowedStatusCodeRanges,
                        statusCodeRangeInput()
                      )
                    " />
                  <div *hlmAutocompletePortal hlmAutocompleteContent>
                    <hlm-autocomplete-empty>Add a custom one</hlm-autocomplete-empty>
                    <div hlmAutocompleteList>
                      @for (
                        statusCodeRange of filteredPredefinedStatusCodeRanges();
                        track statusCodeRange
                      ) {
                        <hlm-autocomplete-item
                          [value]="statusCodeRange"
                          (click)="
                            select(
                              httpDataFormGroup.controls.allowedStatusCodeRanges,
                              statusCodeRange
                            )
                          ">
                          {{ statusCodeRange }}
                        </hlm-autocomplete-item>
                      }
                    </div>
                  </div>
                </hlm-autocomplete-search>
              </div>
              <button
                [hlmTooltip]="'monitor.edit.http.allowedStatusCodeRanges.enter' | transloco"
                (click)="
                  select(httpDataFormGroup.controls.allowedStatusCodeRanges, statusCodeRangeInput())
                "
                hlmBtn
                variant="outline"
                type="button">
                <ng-icon hlm name="lucideCirclePlus" size="sm" />
              </button>
            </div>

            <div class="flex flex-wrap gap-2">
              @for (
                statusCodeRange of httpDataFormGroup.controls.allowedStatusCodeRanges.getRawValue();
                track statusCodeRange
              ) {
                <span hlmBadge variant="secondary">
                  <div class="flex items-center justify-center gap-1">
                    <span>{{ statusCodeRange }}</span>
                    <button
                      [attr.aria-label]="
                        'monitor.edit.http.allowedStatusCodeRanges.remove'
                          | transloco: {email: statusCodeRange}
                      "
                      (click)="
                        chipInputRemove(
                          httpDataFormGroup.controls.allowedStatusCodeRanges,
                          statusCodeRange
                        )
                      "
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
            @let allowedStatusCodeRangeErrors =
              httpDataFormGroup.controls.allowedStatusCodeRanges.errors;
            @if (allowedStatusCodeRangeErrors?.['required']) {
              <hlm-field-error>{{ 'form.validation.required' | transloco }}</hlm-field-error>
            }
            @if (allowedStatusCodeRangeErrors?.['patternArrayItem']) {
              {{ 'monitor.edit.http.allowedStatusCodeRanges.inputRegexError' | transloco }}
            }
            @if (allowedStatusCodeRangeErrors?.['minLengthArrayItem']; as minlength) {
              <hlm-field-error>
                {{ 'form.validation.minlength' | transloco: minlength }}
              </hlm-field-error>
            }
            @if (allowedStatusCodeRangeErrors?.['maxLengthArrayItem']; as maxlength) {
              <hlm-field-error>
                {{ 'form.validation.maxlength' | transloco: maxlength }}
              </hlm-field-error>
            }
            @if (allowedStatusCodeRangeErrors?.['inputRegex']) {
              <hlm-field-error>
                {{ 'monitor.edit.http.allowedStatusCodeRanges.inputRegexError' | transloco }}
              </hlm-field-error>
            }
            @if (allowedStatusCodeRangeErrors?.['inputStartBiggerThenEnd']) {
              <hlm-field-error>
                {{
                  'monitor.edit.http.allowedStatusCodeRanges.inputStartBiggerThenEndError'
                    | transloco
                }}
              </hlm-field-error>
            }
            @if (allowedStatusCodeRangeErrors?.['rangeIncorrect']) {
              <hlm-field-error>
                {{ 'monitor.edit.http.allowedStatusCodeRanges.rangeIncorrectError' | transloco }}
              </hlm-field-error>
            }
          </div>

          <hlm-field class="col-span-8 xl:col-span-3">
            <label hlmFieldLabel for="maxRedirects">
              {{ 'monitor.edit.http.maxRedirects.label' | transloco }}
            </label>

            <input
              id="maxRedirects"
              hlmInput
              formControlName="maxRedirects"
              type="number"
              step="1" />

            <p hlmFieldDescription>{{ 'monitor.edit.http.maxRedirects.hint' | transloco }}</p>

            @let maxRedirectErrors = httpDataFormGroup.controls.maxRedirects.errors;
            @if (maxRedirectErrors?.['min']; as min) {
              <hlm-field-error>{{ 'form.validation.min' | transloco: min }}</hlm-field-error>
            }
            @if (maxRedirectErrors?.['max']; as max) {
              <hlm-field-error>{{ 'form.validation.max' | transloco: max }}</hlm-field-error>
            }
            @if (maxRedirectErrors?.['pattern']) {
              <hlm-field-error>{{ 'form.validation.integer' | transloco }}</hlm-field-error>
            }
          </hlm-field>

          <hlm-accordion class="col-span-8">
            <hlm-accordion-item>
              <hlm-accordion-trigger>Advanced Response Validation</hlm-accordion-trigger>
              <hlm-accordion-content>
                <hlm-field>
                  <label hlmFieldLabel for="searchTerm">
                    {{ 'monitor.edit.http.searchTerm' | transloco }}
                  </label>
                  <textarea
                    class="w-full"
                    id="searchTerm"
                    hlmTextarea
                    placeholder="Search for specific text in the response"
                    formControlName="searchTerm"
                    rows="3"
                    cdkTextareaAutosize
                    cdkAutosizeMinRows="3"></textarea>
                </hlm-field>

                <hlm-field>
                  <label hlmFieldLabel for="body">{{ 'general.body' | transloco }}</label>
                  <textarea
                    class="w-full"
                    id="body"
                    hlmTextarea
                    placeholder='{"key": "value"}'
                    formControlName="body"
                    rows="3"
                    cdkTextareaAutosize
                    cdkAutosizeMinRows="3"></textarea>
                </hlm-field>
              </hlm-accordion-content>
            </hlm-accordion-item>
          </hlm-accordion>
        </div>
      </pu-monitor-edit-form-data-card>

      <section hlmCard>
        <div hlmCardHeader>
          <h4 hlmCardTitle>Security & TLS</h4>
          <p hlmCardDescription>Configure certificate and TLS settings</p>
        </div>
        <div class="space-y-4" hlmCardContent>
          <label class="flex items-center justify-between" hlmLabel for="certificateExpiry">
            <div class="space-y-1">
              {{ 'monitor.edit.http.certificateExpiry' | transloco }}
              <p class="text-muted-foreground text-xs">
                Get notified before SSL certificate expires
              </p>
            </div>
            <hlm-switch inputId="certificateExpiry" formControlName="certificateExpiry" />
          </label>

          @if (httpDataFormGroup.controls.certificateExpiry.getRawValue()) {
            <div
              class="border-muted ml-0 space-y-2 border-l-0 pl-0 sm:ml-2 sm:border-l-2 sm:pl-4"
              animate.enter="animate-in fade-in slide-in-from-top-20"
              animate.leave="animate-out fade-out slide-out-to-top-20">
              <hlm-field>
                <label hlmFieldLabel for="certificateValidDaysLeft">
                  {{ 'monitor.edit.ssl.validDaysLeft' | transloco }}
                </label>

                <input
                  id="certificateValidDaysLeft"
                  hlmInput
                  formControlName="certificateValidDaysLeft"
                  step="1"
                  type="number" />

                <p hlmFieldDescription>Alert when certificate expires within this many days</p>

                @let validDaysLeftErrors =
                  httpDataFormGroup.controls.certificateValidDaysLeft.errors;
                @if (validDaysLeftErrors?.['min']; as min) {
                  <hlm-field-error>{{ 'form.validation.min' | transloco: min }}</hlm-field-error>
                }
                @if (validDaysLeftErrors?.['max']; as max) {
                  <hlm-field-error>{{ 'form.validation.max' | transloco: max }}</hlm-field-error>
                }
                @if (validDaysLeftErrors?.['pattern']) {
                  <hlm-field-error>{{ 'form.validation.integer' | transloco }}</hlm-field-error>
                }
              </hlm-field>
            </div>
          }

          <label class="flex items-center justify-between" hlmLabel for="ignoreTLS">
            <div class="space-y-1">
              {{ 'monitor.edit.http.ignoreTLS' | transloco }}
              <p class="text-muted-foreground text-xs">
                Skip certificate validation (not recommended)
              </p>
            </div>
            <hlm-switch inputId="ignoreTLS" formControlName="ignoreTLS" />
          </label>
        </div>
      </section>
    </div>
  `,
  selector: 'pu-monitor-edit-form-http-data',
  imports: [
    PasswordShowButton,
    MonitorEditFormDataCard,
    ReactiveFormsModule,
    TranslocoPipe,
    CdkTextareaAutosize,
    HlmLabelImports,
    HlmSwitchImports,
    HlmSelectImports,
    HlmSeparatorImports,
    HlmInputImports,
    HlmInputGroupImports,
    HlmButtonImports,
    HlmCardImports,
    HlmIconImports,
    HlmTooltipImports,
    HlmBadgeImports,
    HlmAutocompleteImports,
    HlmAccordionImports,
    HlmTextareaImports,
    HlmFieldImports,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonitorEditFormHttpData {
  protected readonly chipInputRemove = chipInputRemove;
  protected readonly httpDataFormGroup = inject(MonitorEditFormDataService).httpDataFormGroup;

  private readonly allowedStatusCodeRanges = toSignal(
    this.httpDataFormGroup.controls.allowedStatusCodeRanges.valueChanges.pipe(
      filter((it): it is string[] => !!it),
    ),
    {initialValue: this.httpDataFormGroup.controls.allowedStatusCodeRanges.getRawValue() ?? []},
  );

  protected readonly statusCodeRangeInput = signal<string | null>(null);
  protected readonly statusCodeRangeSearch = signal('');

  protected readonly filteredPredefinedStatusCodeRanges = computed(() => {
    const allowedStatusCodeRanges = this.allowedStatusCodeRanges();
    const statusCodeRanges = predefinedStatusCodeRanges.filter(
      (it) => !allowedStatusCodeRanges.includes(it),
    );
    const value = this.statusCodeRangeSearch().trim().toLowerCase();

    if (value.length === 0) {
      return statusCodeRanges;
    }

    return statusCodeRanges.filter((it) => it.trim().toLowerCase().includes(value));
  });

  protected select(control: FormControl<string[] | null>, rawValue: string | null): void {
    if (!rawValue) {
      return;
    }

    const value = rawValue.trim();

    if (value.length === 0) {
      return;
    }

    // HACK
    // The chip grid will reset the errors on leaving the input box
    // This slightly delays the setting of said error, so it happens after the chip grid resetting the errors
    if (!Database.STATUS_CODE_REGEX.test(value)) {
      setTimeout(() => {
        control.setErrors({inputRegex: true});
      }, 10);
      return;
    }

    const parts = value.split('-').map((it) => it.trim());
    const start = Number(parts[0]);
    const end = Number(parts[1]);

    if (start < 100 || end > 599) {
      setTimeout(() => {
        control.setErrors({rangeIncorrect: true});
      }, 10);
      return;
    }

    if (start > end) {
      setTimeout(() => {
        control.setErrors({inputStartBiggerThenEnd: true});
      }, 10);
      return;
    }

    control.setValue([...(control.value ?? []), `${start} - ${end}`]);

    this.statusCodeRangeInput.set(null);
    this.statusCodeRangeSearch.set('');
  }
}
