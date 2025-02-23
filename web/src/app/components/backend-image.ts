import {NgOptimizedImage} from '@angular/common';
import {ChangeDetectionStrategy, Component, input} from '@angular/core';

import {injectIsPlatformDocker} from '@app/services';
import {DOCKER_BACKEND_API_URL} from '@app/util';

import {environment} from '../../environments/environment';

@Component({
  template: `
    @let _size = size();
    <img
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
  fileId = input.required<string>();
  title = input.required<string>();
  class = input<string>();
  width = input<string>();
  height = input<string>();
  size = input<string>();

  isDocker = injectIsPlatformDocker();
  baseUrl = this.isDocker ? DOCKER_BACKEND_API_URL : environment.apiUrl;
}
