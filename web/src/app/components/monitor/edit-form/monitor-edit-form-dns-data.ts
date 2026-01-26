import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';

import {
  MatChipGrid,
  MatChipInput,
  MatChipInputEvent,
  MatChipRemove,
  MatChipRow,
} from '@angular/material/chips';
import {MatFormField, MatLabel} from '@angular/material/form-field';

import {TranslocoPipe} from '@jsverse/transloco';
import {NgIcon} from '@ng-icons/core';
import {BrnSelectImports} from '@spartan-ng/brain/select';
import {HlmFormFieldImports} from '@spartan-ng/helm/form-field';
import {HlmInputImports} from '@spartan-ng/helm/input';
import {HlmLabelImports} from '@spartan-ng/helm/label';
import {HlmSelectImports} from '@spartan-ng/helm/select';
import {cl_copy} from 'dfts-helper';
import {toast} from 'ngx-sonner';

import {MonitorEditFormDataService} from './monitor-edit-form-data.service';

@Component({
  template: `
    <div class="grid grid-cols-8 gap-4" [formGroup]="dnsDataFormGroup">
      <hlm-form-field class="col-span-8 xl:col-span-6">
        <label hlmLabel for="host">{{ 'general.host' | transloco }}</label>
        <input id="host" hlmInput formControlName="host" type="text" placeholder="google.com" />
        @let hostErrors = dnsDataFormGroup.controls.host.errors;

        @if (hostErrors?.['required']) {
          <hlm-error>{{ 'form.validation.required' | transloco }}</hlm-error>
        }
        @if (hostErrors?.['minlength']; as minlength) {
          <hlm-error>{{ 'form.validation.minlength' | transloco: minlength }}</hlm-error>
        }
        @if (hostErrors?.['maxlength']; as maxlength) {
          <hlm-error>{{ 'form.validation.maxlength' | transloco: maxlength }}</hlm-error>
        }
        @if (hostErrors?.['pattern']) {
          <hlm-error>{{ 'form.validation.domain' | transloco }}</hlm-error>
        }
      </hlm-form-field>

      <hlm-form-field class="col-span-8 xl:col-span-2">
        <label hlmLabel for="method">{{ 'general.type' | transloco }}</label>
        <brn-select id="method" [placeholder]="'general.type' | transloco" formControlName="type">
          <hlm-select-trigger class="w-full">
            <hlm-select-value />
          </hlm-select-trigger>
          <hlm-select-content>
            <hlm-option value="A">A</hlm-option>
            <hlm-option value="AAAA">AAAA</hlm-option>
            <hlm-option value="CAA">CAA</hlm-option>
            <hlm-option value="CNAME">CNAME</hlm-option>
            <hlm-option value="MX">MX</hlm-option>
            <hlm-option value="NS">NS</hlm-option>
            <hlm-option value="PTR">PTR</hlm-option>
            <hlm-option value="SOA">SOA</hlm-option>
            <hlm-option value="SRV">SRV</hlm-option>
            <hlm-option value="TXT">TXT</hlm-option>
          </hlm-select-content>
        </brn-select>

        @let typeErrors = dnsDataFormGroup.controls.type.errors;

        @if (typeErrors?.['required']) {
          <hlm-error>{{ 'form.validation.required' | transloco }}</hlm-error>
        }
      </hlm-form-field>

      <hlm-form-field class="col-span-8 xl:col-span-6">
        <label hlmLabel for="server">{{ 'monitor.edit.dns.server' | transloco }}</label>
        <input id="server" hlmInput formControlName="server" type="text" placeholder="9.9.9.9" />
        @let serverErrors = dnsDataFormGroup.controls.server.errors;
        @if (serverErrors?.['required']) {
          <hlm-error>{{ 'form.validation.required' | transloco }}</hlm-error>
        }
        @if (serverErrors?.['minlength']; as minlength) {
          <hlm-error>{{ 'form.validation.minlength' | transloco: minlength }}</hlm-error>
        }
        @if (serverErrors?.['maxlength']; as maxlength) {
          <hlm-error>{{ 'form.validation.maxlength' | transloco: maxlength }}</hlm-error>
        }
        @if (serverErrors?.['pattern']) {
          <hlm-error>{{ 'form.validation.ipv4' | transloco }}</hlm-error>
        }
      </hlm-form-field>

      <hlm-form-field class="col-span-8 xl:col-span-2">
        <label hlmLabel for="port">{{ 'general.port' | transloco }}</label>

        <input id="port" hlmInput formControlName="port" step="1" type="number" />

        @let portErrors = dnsDataFormGroup.controls.port.errors;
        @if (portErrors?.['required']) {
          <hlm-error>{{ 'form.validation.required' | transloco }}</hlm-error>
        }
        @if (portErrors?.['min']; as min) {
          <hlm-error>{{ 'form.validation.min' | transloco: min }}</hlm-error>
        }
        @if (portErrors?.['max']; as max) {
          <hlm-error>{{ 'form.validation.max' | transloco: max }}</hlm-error>
        }
        @if (portErrors?.['pattern']) {
          <hlm-error>{{ 'form.validation.integer' | transloco }}</hlm-error>
        }
      </hlm-form-field>

      <mat-form-field class="col-span-8">
        <mat-label>{{ 'monitor.edit.dns.matches.label' | transloco }}</mat-label>
        <mat-chip-grid #chipGrid [attr.aria-label]="'monitor.edit.dns.matches.label' | transloco">
          @for (match of dnsDataFormGroup.controls.matches.getRawValue(); track match) {
            <mat-chip-row (removed)="removeDNSMatch(match)" (click)="copyToClipboard(match)">
              {{ match }}
              <button
                [attr.aria-label]="'monitor.edit.dns.matches.remove' | transloco: {match}"
                type="button"
                matChipRemove>
                <ng-icon name="bootstrapX" />
              </button>
            </mat-chip-row>
          }
        </mat-chip-grid>
        <input
          [matChipInputFor]="chipGrid"
          [placeholder]="'monitor.edit.dns.matches.new' | transloco"
          (matChipInputTokenEnd)="addDNSMatch($event)" />
      </mat-form-field>
    </div>
  `,
  selector: 'pu-monitor-edit-form-dns-data',
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatChipGrid,
    MatChipInput,
    MatChipRemove,
    MatChipRow,
    NgIcon,
    TranslocoPipe,
    HlmSelectImports,
    BrnSelectImports,
    HlmFormFieldImports,
    HlmLabelImports,
    HlmInputImports,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonitorEditFormDnsData {
  dnsDataFormGroup = inject(MonitorEditFormDataService).dnsDataFormGroup;

  addDNSMatch(event: MatChipInputEvent) {
    const value = (event.value || '').trim();

    // Add our keyword
    if (value.length > 0) {
      const matches = this.dnsDataFormGroup.controls.matches.getRawValue() ?? [];

      matches.push(value);

      this.dnsDataFormGroup.controls.matches.setValue(matches);
    }

    // Clear the input value
    event.chipInput!.clear();
  }

  removeDNSMatch(match: string) {
    const matches = this.dnsDataFormGroup.controls.matches.getRawValue() ?? [];
    const index = matches.findIndex((it) => match.includes(it));

    if (index !== -1) {
      matches!.splice(index, 1);
    }

    this.dnsDataFormGroup.controls.matches.setValue(matches);
  }

  copyToClipboard(it: string) {
    cl_copy(it);

    toast.success(`"${it}" copied to clipboard`);

    toast.promise(() => new Promise((resolve) => setTimeout(resolve, 0)), {
      loading: '',
      success: `"${it}" copied to clipboard`,
      error: '',
    });
  }
}
