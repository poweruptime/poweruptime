import {pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withHooks, withMethods, withState} from '@ngrx/signals';
import {rxMethod} from '@ngrx/signals/rxjs-interop';

import {setError, setFulfilled, setPending, withRequestStatus} from '@app/services/store-features';

import {BackendType, injectAPI} from '../api';

export const InfoStore = signalStore(
  {providedIn: 'root'},
  withState<{environment: BackendType['AdminInfoResponse'] | undefined}>({environment: undefined}),
  withRequestStatus(),
  withMethods((store, api = injectAPI()) => ({
    load: rxMethod<void>(
      pipe(
        tap(() => patchState(store, setPending())),
        switchMap(() =>
          api.get('/v1/info/environment').pipe(
            tapResponse({
              next: (environment) => patchState(store, () => ({environment}), setFulfilled()),
              error: (error) => patchState(store, setError(error)),
            }),
          ),
        ),
      ),
    ),
  })),
  withHooks((store) => ({
    onInit: () => {
      store.load();
    },
  })),
);
