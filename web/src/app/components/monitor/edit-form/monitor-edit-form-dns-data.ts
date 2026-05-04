import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';

import {TranslocoPipe} from '@jsverse/transloco';
import '@spartan-ng/brain/select';
import {HlmBadgeImports} from '@spartan-ng/helm/badge';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmFieldImports} from '@spartan-ng/helm/field';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmInputImports} from '@spartan-ng/helm/input';
import {HlmInputGroupImports} from '@spartan-ng/helm/input-group';
import {HlmLabelImports} from '@spartan-ng/helm/label';
import {HlmSelectImports} from '@spartan-ng/helm/select';
import {HlmTooltipImports} from '@spartan-ng/helm/tooltip';

import {chipInputAdd, chipInputRemove} from '@app/util';

import {CopyIconButton} from '../../copy-icon-button';
import {MonitorEditFormDataService} from './monitor-edit-form-data.service';

@Component({
  template: `
    <div class="grid grid-cols-8 gap-4" [formGroup]="dnsDataFormGroup">
      <hlm-field class="col-span-8 xl:col-span-6">
        <label hlmLabel for="host">{{ 'general.host' | transloco }}</label>
        <input id="host" hlmInput formControlName="host" type="text" placeholder="google.com" />
        @let hostErrors = dnsDataFormGroup.controls.host.errors;

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

      <hlm-field class="col-span-8 xl:col-span-2">
        <label hlmLabel for="method">{{ 'general.type' | transloco }}</label>
        <hlm-select id="method" formControlName="type">
          <hlm-select-trigger class="w-full">
            <hlm-select-value [placeholder]="'general.type' | transloco" />
          </hlm-select-trigger>
          <hlm-select-content *hlmSelectPortal>
            <hlm-select-group>
              <hlm-select-item value="A">A</hlm-select-item>
              <hlm-select-item value="AAAA">AAAA</hlm-select-item>
              <hlm-select-item value="CAA">CAA</hlm-select-item>
              <hlm-select-item value="CNAME">CNAME</hlm-select-item>
              <hlm-select-item value="MX">MX</hlm-select-item>
              <hlm-select-item value="NS">NS</hlm-select-item>
              <hlm-select-item value="PTR">PTR</hlm-select-item>
              <hlm-select-item value="SOA">SOA</hlm-select-item>
              <hlm-select-item value="SRV">SRV</hlm-select-item>
              <hlm-select-item value="TXT">TXT</hlm-select-item>
            </hlm-select-group>
          </hlm-select-content>
        </hlm-select>

        @let typeErrors = dnsDataFormGroup.controls.type.errors;

        @if (typeErrors?.['required']) {
          <hlm-field-error>{{ 'form.validation.required' | transloco }}</hlm-field-error>
        }
      </hlm-field>

      <hlm-field class="col-span-8 xl:col-span-6">
        <label hlmLabel for="server">{{ 'monitor.edit.dns.server' | transloco }}</label>
        <input id="server" hlmInput formControlName="server" type="text" placeholder="9.9.9.9" />
        @let serverErrors = dnsDataFormGroup.controls.server.errors;
        @if (serverErrors?.['required']) {
          <hlm-field-error>{{ 'form.validation.required' | transloco }}</hlm-field-error>
        }
        @if (serverErrors?.['minlength']; as minlength) {
          <hlm-field-error>
            {{ 'form.validation.minlength' | transloco: minlength }}
          </hlm-field-error>
        }
        @if (serverErrors?.['maxlength']; as maxlength) {
          <hlm-field-error>
            {{ 'form.validation.maxlength' | transloco: maxlength }}
          </hlm-field-error>
        }
        @if (serverErrors?.['pattern']) {
          <hlm-field-error>{{ 'form.validation.ipv4' | transloco }}</hlm-field-error>
        }
      </hlm-field>

      <hlm-field class="col-span-8 xl:col-span-2">
        <label hlmLabel for="port">{{ 'general.port' | transloco }}</label>

        <input id="port" hlmInput formControlName="port" step="1" type="number" />

        @let portErrors = dnsDataFormGroup.controls.port.errors;
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

      <div class="col-span-8 grid gap-2">
        <div class="flex items-end gap-2">
          <form
            class="w-full space-y-2"
            id="matchForm"
            [formGroup]="matchForm"
            (ngSubmit)="chipInputAdd(dnsDataFormGroup.controls.matches, matchForm.controls.match)">
            <hlm-field class="w-full">
              <label for="match" hlmLabel>{{ 'monitor.edit.dns.matches.label' | transloco }}</label>
              <div hlmInputGroup>
                <input
                  id="match"
                  [placeholder]="'monitor.edit.dns.matches.new' | transloco"
                  hlmInputGroupInput
                  type="text"
                  formControlName="match" />
                <div hlmInputGroupAddon>
                  <ng-icon name="lucideEqual" />
                </div>
              </div>
            </hlm-field>
          </form>
          <button
            [disabled]="matchForm.invalid"
            [hlmTooltip]="'monitor.edit.dns.matches.enter' | transloco"
            hlmBtn
            variant="outline"
            form="matchForm"
            type="submit">
            <ng-icon hlm name="lucideCirclePlus" size="sm" />
          </button>
        </div>

        <div class="flex flex-wrap gap-2">
          @for (match of dnsDataFormGroup.controls.matches.getRawValue(); track match) {
            <span hlmBadge variant="secondary">
              <div class="flex items-center justify-center gap-1">
                <span>{{ match }}</span>
                <div>
                  <pu-copy-icon-button [content]="match" size="xs" />
                  <button
                    [attr.aria-label]="'monitor.edit.dns.matches.remove' | transloco: {match}"
                    (click)="chipInputRemove(dnsDataFormGroup.controls.matches, match)"
                    hlmBtn
                    variant="ghost"
                    size="icon-xs"
                    type="button">
                    <ng-icon hlm name="lucideX" size="xs" />
                  </button>
                </div>
              </div>
            </span>
          }
        </div>
      </div>
    </div>
  `,
  selector: 'pu-monitor-edit-form-dns-data',
  imports: [
    CopyIconButton,
    ReactiveFormsModule,
    TranslocoPipe,
    HlmSelectImports,
    HlmLabelImports,
    HlmInputImports,
    HlmBadgeImports,
    HlmButtonImports,
    HlmInputGroupImports,
    HlmIconImports,
    HlmTooltipImports,
    HlmFieldImports,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonitorEditFormDnsData {
  protected readonly chipInputRemove = chipInputRemove;
  protected readonly chipInputAdd = chipInputAdd;

  protected readonly dnsDataFormGroup = inject(MonitorEditFormDataService).dnsDataFormGroup;

  protected readonly matchForm = inject(NonNullableFormBuilder).group({
    match: ['', Validators.required],
  });
}
