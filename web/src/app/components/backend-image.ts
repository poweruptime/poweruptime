import {NgOptimizedImage} from '@angular/common';
import {ChangeDetectionStrategy, Component, input} from '@angular/core';

import {injectIsPlatformDocker} from '@app/services';
import {DOCKER_BACKEND_API_URL} from '@app/util';

import {environment} from '../../environments/environment';

@Component({
  template: `
    <img class="rounded-xl" [ngSrc]="baseUrl + '/v1/public/file' + src()" width="75" height="75" />
  `,
  selector: 'pu-backend-image',
  imports: [NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackendImage {
  src = input.required<string>();

  isDocker = injectIsPlatformDocker();
  baseUrl = this.isDocker ? DOCKER_BACKEND_API_URL : environment.apiUrl;
}
