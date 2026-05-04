import {inject} from '@angular/core';
import {Router} from '@angular/router';

import {pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withMethods} from '@ngrx/signals';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {toast} from '@spartan-ng/brain/sonner';

import {injectAPI} from '@app/api';
import {ProfileStore} from '@app/services';
import {setError, setFulfilled, setPending, withRequestStatus} from '@app/services/store-features';

export const EmailChangeStore = signalStore(
  withRequestStatus(),
  withMethods(
    (store, router = inject(Router), api = injectAPI(), profileStore = inject(ProfileStore)) => ({
      confirm: rxMethod<string>(
        pipe(
          tap(() => patchState(store, setPending())),
          switchMap((token) =>
            api.get('/v1/public/email-change/confirm/{token}', {params: {path: {token}}}).pipe(
              tapResponse({
                next: () => {
                  patchState(store, setFulfilled());
                  toast.success('Successfully changed email address.');
                  profileStore.loadProfile();
                  void router.navigate(['', 'profile']);
                },
                error: (error) => {
                  patchState(store, setError(error));

                  const httpCode = store.error()?.httpCode;
                  console.log('confirm email change failed', httpCode, store.error());

                  if (httpCode === 429) {
                    toast.error('Email address can be changed only once in 3 days.');
                  } else if (httpCode === 403) {
                    toast.error('Invalid token');
                  }

                  void router.navigate(['', 'profile']);
                },
              }),
            ),
          ),
        ),
      ),
      undo: rxMethod<string>(
        pipe(
          tap(() => patchState(store, setPending())),
          switchMap((token) =>
            api.get('/v1/public/email-change/undo/{token}', {params: {path: {token}}}).pipe(
              tapResponse({
                next: () => {
                  patchState(store, setFulfilled());
                  toast.success('Successfully cancel/restored email address change.');
                  profileStore.loadProfile();
                  void router.navigate(['', 'profile']);
                },
                error: (error) => {
                  patchState(store, setError(error));

                  const httpCode = store.error()?.httpCode;

                  if (httpCode === 403) {
                    toast.error('Invalid token');
                  }

                  void router.navigate(['', 'profile']);
                },
              }),
            ),
          ),
        ),
      ),
    }),
  ),
);
