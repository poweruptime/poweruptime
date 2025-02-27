import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {
  MatChipGrid,
  MatChipInput,
  MatChipInputEvent,
  MatChipRemove,
  MatChipRow,
} from '@angular/material/chips';
import {MatError, MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatOption, MatSelect} from '@angular/material/select';

import {TranslocoPipe} from '@jsverse/transloco';
import {cl_copy} from 'dfts-helper';
import {BiComponent} from 'dfx-bootstrap-icons';
import {toast} from 'ngx-sonner';

import {MonitorEditFormDataService} from './monitor-edit-form-data.service';

@Component({
  template: `
    <div class="flex flex-col gap-4" [formGroup]="dnsDataFormGroup">
      <div class="flex gap-2">
        <mat-form-field class="w-full">
          <mat-label>{{ 'general.host' | transloco }}</mat-label>
          <input matInput formControlName="host" />
          @let hostErrors = dnsDataFormGroup.controls.host.errors;

          @if (hostErrors?.['required']) {
            <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
          }
          @if (hostErrors?.['minlength']; as minlength) {
            <mat-error>{{ 'form.validation.minlength' | transloco: minlength }}</mat-error>
          }
          @if (hostErrors?.['maxlength']; as maxlength) {
            <mat-error>{{ 'form.validation.maxlength' | transloco: maxlength }}</mat-error>
          }
          @if (hostErrors?.['pattern']) {
            <mat-error>{{ 'form.validation.domain' | transloco }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field class="w-48">
          <mat-label>{{ 'general.type' | transloco }}</mat-label>
          <mat-select formControlName="type">
            <mat-option value="A">A</mat-option>
            <mat-option value="AAAA">AAAA</mat-option>
            <mat-option value="CAA">CAA</mat-option>
            <mat-option value="CNAME">CNAME</mat-option>
            <mat-option value="MX">MX</mat-option>
            <mat-option value="NS">NS</mat-option>
            <mat-option value="PTR">PTR</mat-option>
            <mat-option value="SOA">SOA</mat-option>
            <mat-option value="SRV">SRV</mat-option>
            <mat-option value="TXT">TXT</mat-option>
          </mat-select>

          @let typeErrors = dnsDataFormGroup.controls.type.errors;

          @if (typeErrors?.['required']) {
            <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
          }
        </mat-form-field>
      </div>

      <div class="flex gap-2">
        <mat-form-field class="w-full">
          <mat-label>{{ 'monitor.edit.dns.server' | transloco }}</mat-label>
          <input matInput formControlName="server" />
          @let serverErrors = dnsDataFormGroup.controls.server.errors;
          @if (serverErrors?.['required']) {
            <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
          }
          @if (serverErrors?.['minlength']; as minlength) {
            <mat-error>{{ 'form.validation.minlength' | transloco: minlength }}</mat-error>
          }
          @if (serverErrors?.['maxlength']; as maxlength) {
            <mat-error>{{ 'form.validation.maxlength' | transloco: maxlength }}</mat-error>
          }
          @if (serverErrors?.['pattern']) {
            <mat-error>{{ 'form.validation.ipv4' | transloco }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field class="w-48">
          <mat-label>{{ 'general.port' | transloco }}</mat-label>
          <input matInput type="number" formControlName="port" />
          @let portErrors = dnsDataFormGroup.controls.port.errors;
          @if (portErrors?.['required']) {
            <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
          }
          @if (portErrors?.['min']; as min) {
            <mat-error>{{ 'form.validation.min' | transloco: min }}</mat-error>
          }
          @if (portErrors?.['max']; as max) {
            <mat-error>{{ 'form.validation.max' | transloco: max }}</mat-error>
          }
          @if (portErrors?.['pattern']) {
            <mat-error>{{ 'form.validation.integer' | transloco }}</mat-error>
          }
        </mat-form-field>
      </div>

      <mat-form-field>
        <mat-label>{{ 'monitor.edit.dns.matches.label' | transloco }}</mat-label>
        <mat-chip-grid #chipGrid [attr.aria-label]="'monitor.edit.dns.matches.label' | transloco">
          @for (match of dnsDataFormGroup.controls.matches.getRawValue(); track match) {
            <mat-chip-row (removed)="removeDNSMatch(match)" (click)="copyToClipboard(match)">
              {{ match }}
              <button
                [attr.aria-label]="'monitor.edit.dns.matches.remove' | transloco: {match}"
                matChipRemove>
                <bi name="x" />
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
    MatInput,
    MatLabel,
    MatError,
    MatSelect,
    MatOption,
    MatChipGrid,
    MatChipInput,
    MatChipRemove,
    MatChipRow,
    BiComponent,
    TranslocoPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonitorEditFormDnsData {
  dnsDataFormGroup = inject(MonitorEditFormDataService).dnsDataFormGroup;

  addDNSMatch(event: MatChipInputEvent) {
    const value = (event.value || '').trim();

    // Add our keyword
    if (value) {
      const matches = this.dnsDataFormGroup.controls.matches.getRawValue();

      matches?.push(value);

      this.dnsDataFormGroup.controls.matches.setValue(matches);
    }

    // Clear the input value
    event.chipInput!.clear();
  }

  removeDNSMatch(match: string) {
    const matches = this.dnsDataFormGroup.controls.matches.getRawValue();
    const index = matches?.findIndex((it) => it === match);

    if (index && index !== -1) {
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
