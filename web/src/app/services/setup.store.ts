import {pipe, switchMap, tap} from 'rxjs';

import {translate} from '@jsverse/transloco';
import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withMethods, withState} from '@ngrx/signals';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {toast} from '@spartan-ng/brain/sonner';
import confetti from 'canvas-confetti';

import {BackendType, injectAPI} from '@app/api';

import {setError, setFulfilled, setIdle, setPending, withRequestStatus} from './store-features';

interface SetupStoreState {
  state: 'setupTestEmail' | 'confirmTestEmail' | 'setup' | 'setupCompleted';
}

// TODO: Email verify confirm tooltip not translated

export const SetupStore = signalStore(
  {providedIn: 'root'},
  withState<SetupStoreState>({state: 'setupTestEmail'}),
  withRequestStatus(),
  withMethods((store, api = injectAPI()) => ({
    setState(state: SetupStoreState['state']) {
      patchState(store, {state}, setIdle());
    },
    testEmail: rxMethod<string>(
      pipe(
        tap(() => patchState(store, setPending())),
        switchMap((email) =>
          api.post('/v1/public/setup/email', {params: {query: {email}}}).pipe(
            tapResponse({
              next: () => {
                patchState(store, setFulfilled(), {state: 'confirmTestEmail' as const});
                toast.success(translate('auth.setup.testEmail.success'));
              },
              error: (error) => patchState(store, setError(error)),
            }),
          ),
        ),
      ),
    ),
    confirmEmail: rxMethod<string>(
      pipe(
        tap(() => patchState(store, setPending())),
        switchMap((code) =>
          api.get('/v1/public/setup/email/verify', {params: {query: {code}}}).pipe(
            tapResponse({
              next: () => {
                patchState(store, setFulfilled(), {state: 'setup' as const});
                toast.success(translate('auth.setup.confirmEmail.success'));
              },
              error: (error) => patchState(store, setError(error)),
            }),
          ),
        ),
      ),
    ),
    setup: rxMethod<BackendType['SetupDto']>(
      pipe(
        tap(() => patchState(store, setPending())),
        switchMap((body) =>
          api.post('/v1/public/setup', {body}).pipe(
            tapResponse({
              next: () => {
                patchState(store, setFulfilled(), {state: 'setupCompleted' as const});
                toast.success(translate('auth.setup.success'));

                void confetti({
                  particleCount: 100,
                  spread: 160,
                  origin: {y: 0.6},
                });
                setTimeout(() => confetti.reset(), 3000);
              },
              error: (error) => patchState(store, setError(error)),
            }),
          ),
        ),
      ),
    ),
  })),
);
