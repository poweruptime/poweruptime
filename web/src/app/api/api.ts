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

  const envApiUrl = import.meta.env?.['NG_APP_BACKEND_URL'] as string | undefined;
  const apiUrl = isBrowser ? environment.apiUrl : (envApiUrl ?? 'ERROR');

  console.log(
    `apiUrl: "${apiUrl}", isBrowser: ${isBrowser}, environment: "${environment.apiUrl}", env: "${envApiUrl}"`,
  );

  return createOpenAPIHttpClient<paths>(httpClient, {
    baseUrl: apiUrl,
  });
});

export function injectAPI() {
  return inject(APIService);
}
