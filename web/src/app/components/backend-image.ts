import {NgOptimizedImage} from '@angular/common';
import {ChangeDetectionStrategy, Component, input} from '@angular/core';

import {injectIsPlatformDocker} from '@app/services';
import {DOCKER_BACKEND_API_URL} from '@app/util';

import {environment} from '../../environments/environment';

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
  private readonly isDocker = injectIsPlatformDocker();
  protected readonly baseUrl = environment.apiUrl;

  fileId = input.required<string>();
  class = input<string>();
  width = input<string>();
  height = input<string>();
  size = input<string>();
  alt = input<string>('');
}
