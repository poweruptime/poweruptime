import {isPlatformBrowser} from '@angular/common';
import {HttpClient} from '@angular/common/http';
import {PLATFORM_ID, inject} from '@angular/core';

import {createOpenAPIHttpClient} from 'dfx-openapi';
import {createInjectable} from 'ngxtension/create-injectable';

import {environment} from '../../environments/environment';
import type {paths} from './api-types';

export const APIService = createInjectable(() => {
  const httpClient = inject(HttpClient);

  const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  return createOpenAPIHttpClient<paths>(httpClient, {
    baseUrl:
      environment.production && !isBrowser ? 'http://poweruptime-backend:8080/api' : environment.apiUrl,
  });
});

export function injectAPI() {
  return inject(APIService);
}
