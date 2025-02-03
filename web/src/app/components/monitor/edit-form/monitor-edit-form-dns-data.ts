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
import {MatInput} from '@angular/material/input';
import {MatOption, MatSelect} from '@angular/material/select';

import {cl_copy} from 'dfts-helper';
import {BiComponent} from 'dfx-bootstrap-icons';
import {toast} from 'ngx-sonner';

import {MonitorEditFormDataService} from './monitor-edit-form-data.service';

@Component({
  template: `
    <div class="flex flex-col gap-4" [formGroup]="dnsDataFormGroup">
      <div class="flex gap-2">
        <mat-form-field>
          <mat-label>Host</mat-label>
          <input matInput formControlName="host" />
        </mat-form-field>

        <mat-form-field>
          <mat-label>Type</mat-label>
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
        </mat-form-field>
      </div>

      <div class="flex gap-2">
        <mat-form-field>
          <mat-label>Server</mat-label>
          <input matInput formControlName="server" />
        </mat-form-field>

        <mat-form-field>
          <mat-label>Port</mat-label>
          <input matInput type="number" formControlName="port" />
        </mat-form-field>
      </div>

      <mat-form-field>
        <mat-label>Matches</mat-label>
        <mat-chip-grid #chipGrid aria-label="Enter matches">
          @for (match of dnsDataFormGroup.controls.matches.getRawValue(); track match) {
            <mat-chip-row (removed)="removeDNSMatch(match)" (click)="copyToClipboard(match)">
              {{ match }}
              <button matChipRemove aria-label="'remove ' + keyword">
                <bi name="x" />
              </button>
            </mat-chip-row>
          }
        </mat-chip-grid>
        <input
          [matChipInputFor]="chipGrid"
          (matChipInputTokenEnd)="addDNSMatch($event)"
          placeholder="New match" />
      </mat-form-field>
    </div>
  `,
  selector: 'pu-monitor-edit-form-dns-data',
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatInput,
    MatLabel,
    MatSelect,
    MatOption,
    MatChipGrid,
    MatChipInput,
    MatChipRemove,
    MatChipRow,
    BiComponent,
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
