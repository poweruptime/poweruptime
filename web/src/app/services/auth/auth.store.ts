import {inject, linkedSignal} from '@angular/core';
import {Router} from '@angular/router';

import {EMPTY, pipe, switchMap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withMethods, withProps, withState} from '@ngrx/signals';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {toast} from '@spartan-ng/brain/sonner';
import {i_complete, st_removeAll} from 'dfts-helper';
import {injectWindow} from 'dfx-helper';
import {injectLocalStorage} from 'ngxtension/inject-local-storage';

import {BackendType, injectAPI} from '../../api';

interface AuthState {
  redirectUrl: string | undefined;
  error: 'INVALID_CREDENTIALS' | 'PASSWORDS_IDENTICAL' | 'NONE';
  enteredPassword: string | undefined;
}

const localStorageRefreshTokenKey = 'pu_auth_refreshToken';
const localStorageAccessTokenKey = 'pu_auth_accessToken';

export function getSessionInformation(): string {
  const browser = i_complete();
  return `${browser.name} - ${browser.majorVersion}; OS: ${browser.os}; Phone: ${browser.mobile}`;
}

const logoutState = () =>
  ({
    redirectUrl: undefined,
    error: 'NONE' as const,
    enteredPassword: undefined,
  }) satisfies AuthState;

export const AuthStore = signalStore(
  {providedIn: 'root'},
  withState<AuthState>({
    error: 'NONE' as const,
    redirectUrl: undefined,
    enteredPassword: undefined,
  }),
  withProps(() => {
    const accessToken = injectLocalStorage<string>(localStorageAccessTokenKey);
    const refreshToken = injectLocalStorage<string>(localStorageRefreshTokenKey);
    return {
      refreshToken,
      accessToken,
      isLoggedIn: linkedSignal(() => !!refreshToken() || !!accessToken()),
    };
  }),
  withMethods((store, api = injectAPI(), router = inject(Router), window = injectWindow()) => ({
    setRedirectUrl(redirectUrl: string): void {
      patchState(store, {redirectUrl});
    },
    setTokens({accessToken, refreshToken}: {accessToken: string; refreshToken?: string}): void {
      store.accessToken.set(accessToken);
      store.refreshToken.set(refreshToken);
    },
    logout(): void {
      const localLogout = () => {
        patchState(store, logoutState);

        st_removeAll();
        window?.location.reload();
      };

      const refreshToken = store.refreshToken();

      if (refreshToken) {
        api
          .post('/v1/auth/logout', {body: {refreshToken}})
          .pipe(
            tapResponse({
              next: () => localLogout(),
              error: () => localLogout(),
            }),
          )
          .subscribe();

        return;
      }

      localLogout();
    },
    oauth2Login: rxMethod<string | undefined>(
      pipe(
        switchMap((code) => {
          if (!code) {
            toast.error('OAuth login code not available');
            void router.navigate(['', 'auth', 'login']);
            return EMPTY;
          }

          return api.post('/v1/auth/login-oauth', {body: {code}});
        }),
        tapResponse({
          next: ({accessToken, refreshToken}) => {
            patchState(store, {
              error: 'NONE' as const,
            });

            store.accessToken.set(accessToken);
            store.refreshToken.set(refreshToken);

            void router.navigateByUrl(store.redirectUrl() ?? '/');
          },
          error: (error) => {
            console.error(error);
            toast.error('OAuth login succeeded but poweruptime login failed');
            void router.navigate(['', 'auth', 'login']);
          },
        }),
      ),
    ),
    login: rxMethod<Omit<BackendType['LoginDto'], 'sessionInformation'>>(
      switchMap((body) =>
        api
          .post('/v1/auth/login', {
            body: {
              ...body,
              sessionInformation: body.stayLoggedIn ? getSessionInformation() : undefined,
            },
          })
          .pipe(
            tapResponse({
              next: ({accessToken, refreshToken}) => {
                patchState(store, {
                  error: 'NONE' as const,
                });

                store.accessToken.set(accessToken);
                store.refreshToken.set(refreshToken);

                void router.navigateByUrl(store.redirectUrl() ?? '/');
              },
              error: ({error}) => {
                if (error?.codeName === 'PASSWORD_CHANGE_REQUIRED') {
                  patchState(store, {
                    error: 'NONE' as const,
                    enteredPassword: body.password,
                  });
                  console.log(
                    `submitted password - ${body.password} - state - ${store.enteredPassword()}`,
                  );

                  void router.navigate(['', 'auth', 'password-change'], {
                    queryParams: {
                      email: body.email,
                      stayLoggedIn: body.stayLoggedIn,
                    },
                  });

                  return;
                }

                patchState(store, {
                  error: 'INVALID_CREDENTIALS' as const,
                });
              },
            }),
          ),
      ),
    ),
    loginWithPasswordChange: rxMethod<
      Omit<BackendType['LoginWithPasswordChangeDto'], 'sessionInformation'>
    >(
      switchMap((body) =>
        api
          .post('/v1/auth/passwordChange', {
            body: {
              ...body,
              sessionInformation: body.stayLoggedIn ? getSessionInformation() : undefined,
            },
          })
          .pipe(
            tapResponse({
              next: ({accessToken, refreshToken}) => {
                patchState(store, {
                  error: 'NONE' as const,
                });

                store.accessToken.set(accessToken);
                store.refreshToken.set(refreshToken);

                void router.navigateByUrl(store.redirectUrl() ?? '/');
              },
              error: ({error}) => {
                if (error?.codeName === 'NO_PASSWORD_CHANGE_REQUIRED') {
                  void router.navigate(['', 'auth', 'login'], {
                    queryParams: {
                      email: body.email,
                      stayLoggedIn: body.stayLoggedIn,
                    },
                  });
                  patchState(store, {error: 'NONE' as const});

                  return;
                }

                if (error?.codeName === 'PASSWORDS_IDENTICAL') {
                  patchState(store, {
                    error: 'PASSWORDS_IDENTICAL' as const,
                  });

                  return;
                }

                patchState(store, {
                  error: 'INVALID_CREDENTIALS' as const,
                });
              },
            }),
          ),
      ),
    ),
  })),
);
