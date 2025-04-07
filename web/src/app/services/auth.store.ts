import {isPlatformBrowser} from '@angular/common';
import {PLATFORM_ID, inject} from '@angular/core';
import {Router} from '@angular/router';

import {switchMap} from 'rxjs';

import {translate} from '@jsverse/transloco';
import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withMethods, withState} from '@ngrx/signals';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {i_complete, s_fromStorage, st_removeAll, st_set} from 'dfts-helper';
import {toast} from 'ngx-sonner';
import {createInjectionToken} from 'ngxtension/create-injection-token';

import {BackendType, injectAPI} from '@app/api';

interface AuthState {
  error: 'INVALID_CREDENTIALS' | 'PASSWORDS_IDENTICAL' | 'NONE';
  isLoggedIn: boolean;
  accessToken: string | undefined;
  refreshToken: string | undefined;
  redirectUrl: string | undefined;
  enteredPassword: string | undefined;
}

const localStorageRefreshTokenKey = 'pu_auth_refreshToken';
const localStorageAccessTokenKey = 'pu_auth_accessToken';

export function getSessionInformation(): string {
  const browser = i_complete();
  return `${browser.name} - ${browser.majorVersion}; OS: ${browser.os}; Phone: ${browser.mobile}`;
}

const [injectInitialAuthState] = createInjectionToken((): AuthState => {
  const _isPlatformBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  const accessToken = _isPlatformBrowser ? s_fromStorage(localStorageAccessTokenKey) : undefined;

  return {
    error: 'NONE' as const,
    isLoggedIn: !!accessToken,
    accessToken,
    refreshToken: _isPlatformBrowser ? s_fromStorage(localStorageRefreshTokenKey) : undefined,
    redirectUrl: undefined,
    enteredPassword: undefined,
  };
});

const logoutState = () => ({
  isLoggedIn: false,
  error: 'NONE' as const,
  accessToken: undefined,
  refreshToken: undefined,
  enteredPassword: undefined,
});

export const AuthStore = signalStore(
  {providedIn: 'root'},
  withState(() => injectInitialAuthState()),
  withMethods((store, api = injectAPI(), router = inject(Router)) => ({
    setRedirectUrl(redirectUrl: string): void {
      patchState(store, () => ({redirectUrl}));
    },
    setTokens({accessToken, refreshToken}: {accessToken: string; refreshToken?: string}): void {
      patchState(store, () => ({accessToken, refreshToken}));

      st_set(localStorageAccessTokenKey, accessToken);
      st_set(localStorageRefreshTokenKey, refreshToken);
    },
    logout(): void {
      patchState(store, logoutState);

      st_removeAll();
      void router.navigate(['', 'auth', 'login']);
    },
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
              next: (response) => {
                patchState(store, () => ({
                  error: 'NONE' as const,
                  isLoggedIn: true,
                  accessToken: response.accessToken,
                  refreshToken: response.refreshToken,
                }));

                st_set(localStorageAccessTokenKey, response.accessToken);
                st_set(localStorageRefreshTokenKey, response.refreshToken);

                void router.navigateByUrl(store.redirectUrl() ?? '/');
              },
              error: ({error}) => {
                if (error?.codeName === 'PASSWORD_CHANGE_REQUIRED') {
                  patchState(store, () => ({
                    error: 'NONE' as const,
                    enteredPassword: body.password,
                  }));

                  void router.navigate(['', 'auth', 'password-change'], {
                    queryParams: {
                      email: body.email,
                      stayLoggedIn: body.stayLoggedIn,
                    },
                  });

                  return;
                }

                patchState(store, () => ({
                  error: 'INVALID_CREDENTIALS' as const,
                }));
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
              next: (response) => {
                patchState(store, () => ({
                  error: 'NONE' as const,
                  isLoggedIn: true,
                  accessToken: response.accessToken,
                  refreshToken: response.refreshToken,
                }));

                st_set(localStorageAccessTokenKey, response.accessToken);
                st_set(localStorageRefreshTokenKey, response.refreshToken);

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
                  patchState(store, () => ({error: 'NONE' as const}));

                  return;
                }

                if (error?.codeName === 'PASSWORDS_IDENTICAL') {
                  patchState(store, () => ({
                    error: 'PASSWORDS_IDENTICAL' as const,
                  }));

                  return;
                }

                patchState(store, () => ({
                  error: 'INVALID_CREDENTIALS' as const,
                }));
              },
            }),
          ),
      ),
    ),
    refresh: rxMethod<Omit<BackendType['RefreshJwtWithSessionTokenDto'], 'sessionInformation'>>(
      switchMap(() =>
        api
          .post('/v1/auth/refresh', {
            body: {
              refreshToken: store.refreshToken()!!,
              sessionInformation: getSessionInformation(),
            },
          })
          .pipe(
            tapResponse({
              next: (response) => {
                patchState(store, () => ({
                  accessToken: response.accessToken,
                  refreshToken: response.refreshToken,
                }));

                st_set(localStorageAccessTokenKey, response.accessToken);
                st_set(localStorageRefreshTokenKey, response.refreshToken);
              },
              error: () => {
                patchState(store, logoutState);

                st_removeAll();
                void router.navigate(['', 'auth', 'login']);
              },
            }),
          ),
      ),
    ),
    setup: rxMethod<BackendType['SetupDto']>(
      switchMap((body) =>
        api.post('/v1/auth/setup', {body}).pipe(
          tapResponse({
            next: () => {
              toast.success(
                translate('Successfully setup your first admin account. Please login now.'),
              );
              void router.navigate(['', 'auth', 'login']);
            },
            error: () => {},
          }),
        ),
      ),
    ),
    forgotPassword: rxMethod<BackendType['PasswordForgotRequestDto']>(
      switchMap((body) =>
        api.post('/v1/auth/resetPassword', {body}).pipe(
          tapResponse({
            next: () => {
              toast.success(translate('Sent password reset email to your email address.'));
              void router.navigate(['', 'auth', 'login']);
            },
            error: () => {},
          }),
        ),
      ),
    ),
    forgotPasswordUpdate: rxMethod<BackendType['PasswordForgotResetDto']>(
      switchMap((body) =>
        api.post('/v1/auth/resetPassword/update', {body}).pipe(
          tapResponse({
            next: () => {
              toast.success(translate('Password reset successful. Please login now.'));
              void router.navigate(['', 'auth', 'login']);
            },
            error: () => {},
          }),
        ),
      ),
    ),
  })),
);
