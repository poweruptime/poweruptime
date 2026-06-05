import {HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest} from '@angular/common/http';
import {inject} from '@angular/core';

import {Observable, catchError, finalize, map, shareReplay, switchMap, throwError} from 'rxjs';

import {toast} from '@spartan-ng/brain/sonner';
import {loggerOf} from 'dfts-helper';

import {injectAPI} from '@app/api';
import {AuthStore, getSessionInformation} from '@app/services';
import {environment} from '@app/util';

/**
 * Intercept this requests
 */
const includePaths = ['/api'];
/**
 * Don't intercept this requests
 */
const ignorePaths = ['/auth', '/public'];

let refreshRequest$: Observable<string> | undefined;

export function authInterceptor(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  const authStore = inject(AuthStore);
  const api = injectAPI();
  const lumber = loggerOf('authInterceptor');

  if (!includePaths.some((p) => request.url.includes(p))) {
    return next(request);
  }

  if (ignorePaths.some((p) => request.url.includes(p))) {
    return next(request);
  }

  request = addToken(request, authStore.accessToken());

  return next(request).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        /* When a session token was cancelled and the user decides to log out he gets an error and can't log out. This checks the url,
         * clears the cookies and reloads the site. If the Angular app now checks isAuthenticated in the auth guard the
         * app will route to sign in.
         */
        if (request.url.includes('/logout')) {
          authStore.logout();

          return throwError(() => error);
        }

        const refreshToken = authStore.refreshToken();
        if (!refreshToken) {
          authStore.logout();
          return throwError(() => error);
        }

        refreshRequest$ ??= api
          .post('/v1/auth/refresh', {
            body: {
              refreshToken,
              sessionInformation: getSessionInformation(),
            },
          })
          .pipe(
            map((data) => {
              lumber.info('handle401Error', 'JWT token refreshed');
              authStore.setTokens(data);
              return data.accessToken;
            }),
            catchError(() => {
              lumber.error('handle401Error', 'Could not refresh access token with refresh token');
              if (environment.channel === 'production') {
                authStore.logout();
              } else {
                lumber.error(
                  'handle401Error',
                  'Something did not work out during the session refresh! On prod you would have been logged out and the window would have been force refreshed.',
                );
                toast.error(
                  'Something did not work out during the session refresh! On prod you would have been logged out and the window would have been force refreshed.',
                  {
                    duration: 20000,
                    action: {
                      label: 'Logout',
                      onClick: () => authStore.logout(),
                    },
                  },
                );
              }

              return throwError(() => error);
            }),
            finalize(() => {
              refreshRequest$ = undefined;
            }),
            shareReplay({bufferSize: 1, refCount: true}),
          );

        return refreshRequest$.pipe(
          switchMap((accessToken) => next(addToken(request, accessToken))),
        );
      }
      return throwError(() => error);
    }),
  );
}

const addToken = (req: HttpRequest<unknown>, token?: string): HttpRequest<unknown> =>
  req.clone({
    setHeaders: {
      Authorization: `Bearer ${token ?? ''}`,
    },
  });
