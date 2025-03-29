import {inject} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

import {distinctUntilChanged, filter, pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withMethods, withState} from '@ngrx/signals';
import {rxMethod} from '@ngrx/signals/rxjs-interop';

import {BackendType, injectAPI} from '@app/api';
import {setError, setFulfilled, setPending, withRequestStatus} from '@app/services/store-features';

export const UserEditStore = signalStore(
  withRequestStatus(),
  withState<{
    user: BackendType['UserResponse'] | undefined;
  }>({
    user: undefined,
  }),
  withMethods(
    (store, router = inject(Router), relativeTo = inject(ActivatedRoute), api = injectAPI()) => ({
      loadById: rxMethod<string | undefined>(
        pipe(
          filter((it): it is string => !!it),
          distinctUntilChanged(),
          tap(() => patchState(store, setPending(), () => ({user: undefined}))),
          switchMap((id) =>
            api
              .get('/v1/user/{id}', {
                params: {
                  path: {
                    id,
                  },
                },
              })
              .pipe(
                tapResponse({
                  next: (user) => patchState(store, () => ({user}), setFulfilled()),
                  error: (error) => patchState(store, setError(error)),
                }),
              ),
          ),
        ),
      ),
      create: rxMethod<BackendType['CreateUserDto']>(
        switchMap((body) =>
          api.post('/v1/user', {body}).pipe(
            tapResponse({
              next: (team) => {
                void router.navigate(['../', team.id], {relativeTo});
              },
              error: () => {},
            }),
          ),
        ),
      ),
      update: rxMethod<BackendType['UpdateUserDto']>(
        switchMap((body) =>
          api.put('/v1/user', {body}).pipe(
            tapResponse({
              next: () => {
                void router.navigate(['../'], {relativeTo});
              },
              error: (error) => patchState(store, setError(error)),
            }),
          ),
        ),
      ),
    }),
  ),
);
