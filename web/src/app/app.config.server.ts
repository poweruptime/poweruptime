import {ApplicationConfig, mergeApplicationConfig} from '@angular/core';
import {RenderMode, ServerRoute, provideServerRendering, withRoutes} from '@angular/ssr';

import {appConfig} from './app.config';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'public/**',
    renderMode: RenderMode.Server,
  },
  {
    path: 'auth/oauth2/**',
    renderMode: RenderMode.Client,
  },
  {
    path: 'auth/**',
    renderMode: RenderMode.Server,
  },
  {
    path: 'not-found',
    renderMode: RenderMode.Server,
  },
  {
    path: '',
    renderMode: RenderMode.Server,
  },
  {
    path: '**',
    renderMode: RenderMode.Client,
  },
];

const serverConfig: ApplicationConfig = {
  providers: [provideServerRendering(withRoutes(serverRoutes))],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
