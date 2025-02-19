import {HttpClient} from '@angular/common/http';
import {ChangeDetectionStrategy, Component, inject, input, output} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatButton} from '@angular/material/button';
import {MatChipRemove, MatChipRow} from '@angular/material/chips';
import {MAT_ERROR, MatError, MatFormField, MatLabel} from '@angular/material/form-field';

import {TranslocoPipe} from '@jsverse/transloco';
import {FileInputDirective, FileInputValidators} from '@ngx-dropzone/cdk';
import {MatDropzone} from '@ngx-dropzone/material';
import {BiComponent} from 'dfx-bootstrap-icons';

import {injectAPI} from '@app/api';

import {environment} from '../../environments/environment';

@Component({
  template: `
    <div class="flex items-center gap-2">
      <mat-form-field subscriptSizing="dynamic">
        <mat-label>{{ label() }}</mat-label>
        <ngx-mat-dropzone>
          <input [formControl]="fileCtrl" type="file" fileInput />

          @if (file(); as file) {
            <mat-chip-row (removed)="fileCtrl.setValue(null)">
              {{ file.name }}
              <button matChipRemove>
                <bi name="x-circle" />
              </button>
            </mat-chip-row>
          }
        </ngx-mat-dropzone>
        <bi matSuffix name="cloud-arrow-up-fill" />

        @if (fileCtrl.errors?.['accept']) {
          <mat-error>{{ 'form.validation.file' | transloco }}</mat-error>
        }
      </mat-form-field>
      <button
        class="secondary-button"
        [disabled]="fileCtrl.errors?.['accept']"
        (click)="upload()"
        mat-flat-button
        type="button">
        Upload
      </button>
    </div>
  `,
  selector: 'pu-file-upload',
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatError,
    MatChipRemove,
    MatChipRow,
    BiComponent,
    MatDropzone,
    FileInputDirective,
    MatButton,
    TranslocoPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileUpload {
  private readonly httpClient = inject(HttpClient);

  type = input.required();
  label = input.required();

  readonly fileCtrl = new FormControl<File | null>(null, [FileInputValidators.accept('image/*')]);
  readonly file = toSignal(this.fileCtrl.valueChanges);

  readonly fileId = output<string>();

  upload(): void {
    const formData = new FormData();
    formData.append('file', this.file()!);

    this.httpClient.post(`${environment.apiUrl}/v1/file/${this.type()}`, formData).subscribe({
      next: (fileId) => console.log(fileId),
      error: (e) => console.error(e),
    });
  }
}
