import {HttpClient} from '@angular/common/http';
import {inject} from '@angular/core';

import {createOpenAPIHttpClient} from 'dfx-openapi';
import {createInjectable} from 'ngxtension/create-injectable';

import {injectIsPlatformDocker} from '@app/services';
import {DOCKER_BACKEND_API_URL} from '@app/util';

import {environment} from '../../environments/environment';
import type {paths} from './api-types';

export const APIService = createInjectable(() => {
  const httpClient = inject(HttpClient);

  const isDocker = injectIsPlatformDocker();

  return createOpenAPIHttpClient<paths>(httpClient, {
    baseUrl: isDocker ? DOCKER_BACKEND_API_URL : environment.apiUrl,
  });
});

export function injectAPI() {
  return inject(APIService);
}
