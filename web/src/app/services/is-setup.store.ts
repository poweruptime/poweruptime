import {toObservable} from '@angular/core/rxjs-interop';

import {filter, pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withHooks, withMethods, withProps, withState} from '@ngrx/signals';
import {rxMethod} from '@ngrx/signals/rxjs-interop';

import {injectAPI} from '../api';
import {setError, setFulfilled, setPending, withRequestStatus} from './store-features';

export const IsSetupStore = signalStore(
  {providedIn: 'root'},
  withState<{isSetup: boolean | undefined}>({isSetup: undefined}),
  withRequestStatus(),
  withProps((store) => ({
    isSetup$: toObservable(store.isSetup).pipe(filter((it): it is boolean => it !== undefined)),
  })),
  withMethods((store, api = injectAPI()) => ({
    load: rxMethod<void>(
      pipe(
        tap(() => patchState(store, setPending())),
        switchMap(() =>
          api.get('/v1/public/info/is-setup').pipe(
            tapResponse({
              next: ({it}) => patchState(store, {isSetup: it}, setFulfilled()),
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
