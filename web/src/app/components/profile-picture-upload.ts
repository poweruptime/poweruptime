import {HttpClient} from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  linkedSignal,
  output,
} from '@angular/core';

import {FileDragDropDirective} from '@dafnik/file';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmIconImports} from '@spartan-ng/helm/icon';

import {BackendType} from '@app/api';
import {BACKEND_API_URL} from '@app/util';

import {BackendImage} from './backend-image';

@Component({
  template: `
    @let _fileToShow = fileToShow();
    <div class="flex flex-col items-center justify-center gap-2">
      <div class="relative inline-flex">
        <button
          class="border-input relative size-16 overflow-hidden rounded-full border-dashed p-0"
          [maxSize]="maxSize"
          (click)="fileInput?.click()"
          type="button"
          hlmBtn
          fileDragDrop
          variant="outline"
          dragClass="border-[2px] bg-accent/50"
          accept="image/*">
          @if (_fileToShow; as fileToShow) {
            <pu-backend-image
              class="h-full w-full object-cover"
              [fileId]="fileToShow.fileId"
              size="140"
              alt="Preview of uploaded image" />
          } @else {
            <ng-icon class="opacity-60" hlm name="lucideCircleUserRound" size="sm" />
          }
        </button>
        @if (_fileToShow) {
          <button
            class="border-background absolute -top-1 -right-1 size-6 rounded-full border-2"
            (click)="remove()"
            type="button"
            hlmBtn
            size="icon">
            <ng-icon hlm name="lucideX" size="xs" />
          </button>
        }
        <input
          class="hidden"
          #fileInput
          (change)="onFileSelected($event)"
          type="file"
          accept="image/*" />
      </div>
      @if (_fileToShow; as fileToShow) {
        <p class="text-muted-foreground truncate text-xs">
          {{ fileToShow.name }}
        </p>
      }
    </div>
  `,
  selector: 'pu-profile-picture-upload',
  imports: [BackendImage, FileDragDropDirective, HlmButtonImports, HlmIconImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePictureUpload {
  protected readonly maxSize = 5 * 1024 * 1024; // 5MB
  private readonly httpClient = inject(HttpClient);

  public readonly label = input.required();
  public readonly file = input<BackendType['FileResponse']>();

  readonly fileToShow = linkedSignal<BackendType['FileResponse'] | undefined>(this.file);

  readonly fileId = output<string | null>();

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const formData = new FormData();
      formData.append('file', input.files.item(0)!);

      this.httpClient
        .post<BackendType['FileResponse']>(`${BACKEND_API_URL}/v1/file`, formData)
        .subscribe((file) => {
          this.fileToShow.set(file);
          this.fileId.emit(file.fileId);
        });
    }
  }

  remove() {
    this.fileToShow.set(undefined);
    this.fileId.emit(null);
  }
}
