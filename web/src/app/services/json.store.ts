import {toObservable} from '@angular/core/rxjs-interop';

import {filter, pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withHooks, withMethods, withProps, withState} from '@ngrx/signals';
import {rxMethod} from '@ngrx/signals/rxjs-interop';

import {BackendType, injectAPI} from '../api';
import {setError, setFulfilled, setPending, withRequestStatus} from './store-features';

export const JsonStore = signalStore(
  {providedIn: 'root'},
  withState<{json: BackendType['JsonInfoResponse'] | undefined}>({json: undefined}),
  withRequestStatus(),
  withProps((store) => ({
    json$: toObservable(store.json).pipe(
      filter((it): it is BackendType['JsonInfoResponse'] => !!it),
    ),
  })),
  withMethods((store, api = injectAPI()) => {
    const load = rxMethod<void>(
      pipe(
        tap(() => patchState(store, setPending())),
        switchMap(() =>
          api.get('/v1/public/json').pipe(
            tapResponse({
              next: (json) => patchState(store, () => ({json}), setFulfilled()),
              error: (error) => patchState(store, setError(error)),
            }),
          ),
        ),
      ),
    );
    return {
      refresh() {
        load();
      },
      load,
    };
  }),
  withHooks((store) => ({
    onInit: () => {
      store.load();
    },
  })),
);
