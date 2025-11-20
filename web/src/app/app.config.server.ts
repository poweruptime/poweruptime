import {
  HttpInterceptorFn,
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import {ApplicationConfig, mergeApplicationConfig} from '@angular/core';
import {RenderMode, ServerRoute, provideServerRendering, withRoutes} from '@angular/ssr';

import {appConfig} from './app.config';

const serverRedirectInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith('/')) {
    const newUrl = `http://127.0.0.1:4200${req.url}`;
    return next(req.clone({url: newUrl}));
  }

  if (req.url.includes('/api/')) {
    try {
      // Parse the URL to preserve query params, path, etc.
      // We provide a dummy base in case the incoming URL was somehow relative
      const urlObj = new URL(req.url, 'http://127.0.0.1:4200');

      // Force the request to stay inside the container
      urlObj.protocol = 'http:';
      urlObj.hostname = '127.0.0.1';
      urlObj.port = '4200';

      return next(req.clone({url: urlObj.toString()}));
    } catch (error) {
      // If URL parsing fails, let the request proceed as-is
      return next(req);
    }
  }

  return next(req);
};

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
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    provideHttpClient(withInterceptors([serverRedirectInterceptor]), withFetch()),
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
