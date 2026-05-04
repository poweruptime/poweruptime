import {pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withMethods} from '@ngrx/signals';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {toast} from '@spartan-ng/brain/sonner';

import {BackendType, injectAPI} from '@app/api';
import {setError, setFulfilled, setPending, withRequestStatus} from '@app/services/store-features';

export const ProfileEditStore = signalStore(
  withRequestStatus(),
  withMethods((store, api = injectAPI()) => ({
    requestEmailChange: rxMethod<BackendType['UpdateEmailDto']>(
      pipe(
        tap(() => patchState(store, setPending())),
        switchMap((body) =>
          api.put('/v1/profile/email', {body}).pipe(
            tapResponse({
              next: () => {
                patchState(store, setFulfilled());
                toast.success('Successfully requested an email address change.');
              },
              error: (error) => {
                patchState(store, setError(error));

                const httpCode = store.error()?.httpCode;
                const codeName = store.error()?.codeName;
                if (httpCode === 429) {
                  if (codeName === 'EMAIL_ALREADY_CHANGED') {
                    toast.error('Email address can be changed only once in 3 days.');
                  } else {
                    toast.error('Rate-limit exceeded. Try in 3 hours again.');
                  }
                } else if (httpCode === 403) {
                  toast.error('Password incorrect.');
                } else if (httpCode === 400) {
                  toast.error('Email address needs to be different.');
                }
              },
            }),
          ),
        ),
      ),
    ),
    updatePassword: rxMethod<BackendType['UpdatePasswordDto']>(
      pipe(
        tap(() => patchState(store, setPending())),
        switchMap((body) =>
          api.put('/v1/profile/password', {body}).pipe(
            tapResponse({
              next: () => {
                patchState(store, setFulfilled());
                toast.success('Successfully updated password.');
              },
              error: (error) => {
                patchState(store, setError(error));

                const httpCode = store.error()?.httpCode;
                if (httpCode === 403) {
                  toast.error('Password incorrect.');
                }
              },
            }),
          ),
        ),
      ),
    ),
  })),
);
