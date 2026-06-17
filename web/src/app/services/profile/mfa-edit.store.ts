import {pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withHooks, withMethods, withState} from '@ngrx/signals';
import {rxMethod} from '@ngrx/signals/rxjs-interop';

import {BackendType, injectAPI} from '@app/api';
import {setError, setFulfilled, setPending, withRequestStatus} from '@app/services/store-features';

type MFAEditStoreState = 'DISABLED' | 'ENABLED' | 'CONFIRM';

export const MFAEditStore = signalStore(
  withRequestStatus(),
  withState<{
    state: MFAEditStoreState;
    base32Secret: string | undefined;
    backupCodes: string[] | undefined;
  }>({
    state: 'DISABLED',
    base32Secret: undefined,
    backupCodes: undefined,
  }),
  withMethods((store, api = injectAPI()) => ({
    setDone() {
      patchState(store, {backupCodes: undefined});
    },
    load: rxMethod<void>(
      pipe(
        tap(() => patchState(store, setPending())),
        switchMap(() =>
          api.get('/v1/profile/mfa/state').pipe(
            tapResponse({
              next: (state) => patchState(store, setFulfilled(), {state}),
              error: (error) => patchState(store, setError(error)),
            }),
          ),
        ),
      ),
    ),
    setup: rxMethod<void>(
      pipe(
        tap(() => patchState(store, setPending())),
        switchMap(() =>
          api.get('/v1/profile/mfa').pipe(
            tapResponse({
              next: ({base32Secret}) =>
                patchState(store, setFulfilled(), {
                  base32Secret,
                  state: 'CONFIRM' as const,
                }),
              error: (error) => patchState(store, setError(error)),
            }),
          ),
        ),
      ),
    ),
    confirm: rxMethod<BackendType['ConfirmMFADto']>(
      pipe(
        tap(() => patchState(store, setPending())),
        switchMap((body) =>
          api.post('/v1/profile/mfa', {body}).pipe(
            tapResponse({
              next: ({backupCodes}) =>
                patchState(store, setFulfilled(), {
                  backupCodes,
                  state: 'ENABLED' as const,
                  base32Secret: undefined,
                }),
              error: (error) => patchState(store, setError(error)),
            }),
          ),
        ),
      ),
    ),
    delete: rxMethod<void>(
      pipe(
        tap(() => patchState(store, setPending())),
        switchMap(() =>
          api.delete('/v1/profile/mfa').pipe(
            tapResponse({
              next: () =>
                patchState(store, setFulfilled(), {
                  state: 'DISABLED' as const,
                  backupCodes: undefined,
                }),
              error: (error) => patchState(store, setError(error)),
            }),
          ),
        ),
      ),
    ),
  })),
  withHooks({
    onInit(store) {
      store.load();
    },
  }),
);
