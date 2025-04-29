import {NgOptimizedImage} from '@angular/common';
import {ChangeDetectionStrategy, Component, input} from '@angular/core';

import {BACKEND_API_URL} from '@app/util';

@Component({
  template: `
    @let _size = size();
    <img
      [alt]="alt()"
      [class]="class()"
      [ngSrc]="baseUrl + '/v1/public/file/' + fileId()"
      [width]="width() ?? _size"
      [height]="height() ?? _size" />
  `,
  selector: 'pu-backend-image',
  imports: [NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackendImage {
  protected readonly baseUrl = BACKEND_API_URL;

  fileId = input.required<string>();
  class = input<string>();
  width = input<string>();
  height = input<string>();
  size = input<string>();
  alt = input<string>('');
}
