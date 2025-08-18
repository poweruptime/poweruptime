import {pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withHooks, withMethods, withState} from '@ngrx/signals';
import {rxMethod} from '@ngrx/signals/rxjs-interop';

import {injectAPI} from '@app/api';
import {setError, setFulfilled, setPending, withRequestStatus} from '@app/services/store-features';

export const ProfileStore = signalStore(
  {providedIn: 'root'},
  withState<{
    id: string | undefined;
    email: string | undefined;
    name: string | undefined;
    role: 'ADMIN' | 'USER' | undefined;
  }>({
    id: undefined,
    email: undefined,
    name: undefined,
    role: undefined,
  }),
  withRequestStatus(),
  withMethods((store, api = injectAPI()) => ({
    loadProfile: rxMethod<void>(
      pipe(
        tap(() => patchState(store, setPending())),
        switchMap(() =>
          api.get('/v1/profile').pipe(
            tapResponse({
              next: (response) => patchState(store, setFulfilled(), () => response),
              error: (error) => patchState(store, setError(error)),
            }),
          ),
        ),
      ),
    ),
  })),
  withHooks({
    onInit(store) {
      store.loadProfile();
    },
  }),
);
