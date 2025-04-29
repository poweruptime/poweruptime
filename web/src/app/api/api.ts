import {HttpClient} from '@angular/common/http';
import {inject} from '@angular/core';

import {createOpenAPIHttpClient} from 'dfx-openapi';
import {createInjectable} from 'ngxtension/create-injectable';

import {BACKEND_API_URL} from '../util';
import type {paths} from './api-types';

export const APIService = createInjectable(() => {
  const httpClient = inject(HttpClient);

  return createOpenAPIHttpClient<paths>(httpClient, {
    baseUrl: BACKEND_API_URL,
  });
});

export function injectAPI() {
  return inject(APIService);
}
