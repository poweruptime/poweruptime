import {HttpClient} from '@angular/common/http';
import {inject} from '@angular/core';

import {createOpenAPIHttpClient} from 'dfx-openapi';
import {createInjectable} from 'ngxtension/create-injectable';

import {environment} from '../../environments/environment';
import type {paths} from './api-types';

export const APIService = createInjectable(() => {
  const httpClient = inject(HttpClient);

  return createOpenAPIHttpClient<paths>(httpClient, {
    baseUrl: environment.apiUrl,
  });
});

export function injectAPI() {
  return inject(APIService);
}
