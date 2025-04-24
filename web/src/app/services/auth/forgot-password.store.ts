import {inject} from '@angular/core';
import {Router} from '@angular/router';

import {switchMap} from 'rxjs';

import {translate} from '@jsverse/transloco';
import {tapResponse} from '@ngrx/operators';
import {signalStore, withMethods} from '@ngrx/signals';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {toast} from 'ngx-sonner';

import {BackendType, injectAPI} from '../../api';

export const ForgotPasswordStore = signalStore(
  {providedIn: 'root'},
  withMethods((_, api = injectAPI(), router = inject(Router)) => ({
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
