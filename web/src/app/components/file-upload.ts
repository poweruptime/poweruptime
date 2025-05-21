import {HttpClient} from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatChipRemove, MatChipRow} from '@angular/material/chips';
import {MatError, MatFormField, MatLabel, MatSuffix} from '@angular/material/form-field';

import {filter, switchMap} from 'rxjs';

import {TranslocoPipe} from '@jsverse/transloco';
import {FileInputDirective, FileInputValidators} from '@ngx-dropzone/cdk';
import {MatDropzone} from '@ngx-dropzone/material';
import {BiComponent} from 'dfx-bootstrap-icons';

import {BackendType} from '@app/api';

import {BACKEND_API_URL} from '../util';
import {BackendImage} from './backend-image';

@Component({
  template: `
    <mat-form-field class="w-full" subscriptSizing="dynamic">
      <mat-label>{{ label() }}</mat-label>
      <ngx-mat-dropzone>
        <input [formControl]="fileCtrl" type="file" fileInput />

        @if (fileToShow(); as fileToShow) {
          <mat-chip-row>
            {{ fileToShow.name }}
            <button (click)="remove()" matChipRemove type="button">
              <bi name="x-circle" />
            </button>
          </mat-chip-row>
        }
      </ngx-mat-dropzone>
      <bi matSuffix size="24" name="cloud-arrow-up-fill" />

      @if (fileCtrl.errors?.['accept']) {
        <mat-error>{{ 'form.validation.file' | transloco }}</mat-error>
      }
    </mat-form-field>

    @if (fileToShow(); as fileToShow) {
      @if ($any(fileToShow).fileId; as fileId) {
        <pu-backend-image class="mt-4" [fileId]="fileId" size="140" alt="Logo" />
      }
    }
  `,
  selector: 'pu-file-upload',
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatError,
    MatSuffix,
    MatChipRemove,
    MatChipRow,
    BiComponent,
    MatDropzone,
    FileInputDirective,
    TranslocoPipe,
    BackendImage,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileUpload {
  private readonly httpClient = inject(HttpClient);

  label = input.required();
  file = input<BackendType['FileResponse']>();

  readonly fileCtrl = new FormControl<File | null>(null, [FileInputValidators.accept('image/*')]);
  readonly fileToShow = linkedSignal<BackendType['FileResponse'] | File | undefined>(this.file);

  readonly fileId = output<string | null>();

  constructor() {
    this.fileCtrl.valueChanges
      .pipe(
        takeUntilDestroyed(),
        filter((file) => !!file),
        filter(() => this.fileCtrl.errors === null),
        switchMap((file) => {
          this.fileToShow.set(file);
          const formData = new FormData();
          formData.append('file', file);

          return this.httpClient.post<BackendType['FileResponse']>(
            `${BACKEND_API_URL}/v1/file`,
            formData,
          );
        }),
      )
      .subscribe({
        next: (file) => {
          console.log(file);
          this.fileId.emit(file.fileId);
        },
        error: (e) => console.error(e),
      });
  }

  remove() {
    this.fileCtrl.setValue(null);
    this.fileToShow.set(undefined);
    this.fileId.emit(null);
  }
}
