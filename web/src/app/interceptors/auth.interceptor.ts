import {Environment} from '@angular/cli/lib/config/workspace-schema';
import {isPlatformBrowser} from '@angular/common';
import {HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest} from '@angular/common/http';
import {PLATFORM_ID, inject} from '@angular/core';

import {BehaviorSubject, Observable, catchError, filter, switchMap, take, throwError} from 'rxjs';

import {loggerOf} from 'dfts-helper';
import {injectWindow} from 'dfx-helper';
import {toast} from 'ngx-sonner';

import {injectAPI} from '@app/api';
import {AuthStore, getSessionInformation} from '@app/services';

import {environment} from '../../environments/environment';

/**
 * Don't intercept this requests
 */
const paths = ['/auth', 'public', 'assets'];

let isRefreshing = false;
const nextAccessTokenSubject: BehaviorSubject<string | undefined> = new BehaviorSubject<
  string | undefined
>(undefined);

export function authInterceptor(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  const authStore = inject(AuthStore);
  const api = injectAPI();
  const window = injectWindow();
  const lumber = loggerOf('authInterceptor');

  let toIntercept = true;
  for (const path of paths) {
    if (request.url.includes(path)) {
      toIntercept = false;
      break;
    }
  }

  if (!toIntercept) {
    return next(request);
  } else {
    request = addToken(request, authStore.accessToken());

    return next(request).pipe(
      catchError((error) => {
        if (error instanceof HttpErrorResponse) {
          switch (error.status) {
            case 401:
              /* When a session token was cancelled and the user decides to log out he gets an error and can't log out. This checks the url,
               * clears the cookies and reloads the site. If the Angular app now checks isAuthenticated in the auth guard the
               * app will route to sign in.
               */
              if (request.url.includes('/logout')) {
                authStore.logout();

                window?.location.reload();
              }

              if (!isRefreshing) {
                isRefreshing = true;
                nextAccessTokenSubject.next(undefined);

                return api
                  .post('/v1/auth/refresh', {
                    body: {
                      refreshToken: authStore.refreshToken()!!,
                      sessionInformation: getSessionInformation(),
                    },
                  })
                  .pipe(
                    switchMap((data) => {
                      lumber.info('handle401Error', 'JWT token refreshed');
                      isRefreshing = false;
                      nextAccessTokenSubject.next(data.accessToken);

                      authStore.setTokens(data);

                      return next(addToken(request, data.accessToken));
                    }),
                    catchError(() => {
                      lumber.error(
                        'handle401Error',
                        'Could not refresh access token with refresh token',
                      );
                      if (environment.production) {
                        authStore.logout();
                        window?.location.reload();
                      } else {
                        lumber.error(
                          'handle401Error',
                          'Something did not work out during the session refresh! On prod you would have been logged out and the window would have been force refreshed.',
                        );
                        toast.error(
                          'Something did not work out during the session refresh! On prod you would have been logged out and the window would have been force refreshed.',
                          {duration: 20000},
                        );
                      }

                      return next(request);
                    }),
                  );
              } else {
                return nextAccessTokenSubject.pipe(
                  filter((token) => token != undefined),
                  take(1),
                  switchMap((jwt: string | undefined) => {
                    lumber.info('handle401Error', 'Already refreshing; JWT: "' + jwt + '"');
                    return next(addToken(request, jwt));
                  }),
                );
              }
            default:
              return throwError(() => error);
          }
        } else if (error.error instanceof ErrorEvent) {
          // Client Side Error
          lumber.error('intercept', 'Client side error');
          return throwError(() => error as unknown);
        } else {
          // Server Side Error
          lumber.error('intercept', 'Server side error');
          return throwError(() => error as unknown);
        }
      }),
    );
  }
}

const addToken = (req: HttpRequest<unknown>, token?: string): HttpRequest<unknown> =>
  req.clone({
    setHeaders: {
      'content-type': 'application/json',
      Authorization: `Bearer ${token ?? ''}`,
    },
  });
