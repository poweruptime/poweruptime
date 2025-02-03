import {distinctUntilChanged, filter, pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withMethods, withState} from '@ngrx/signals';
import {rxMethod} from '@ngrx/signals/rxjs-interop';

import {BackendType, injectAPI} from '@app/api';
import {setError, setFulfilled, setPending, withRequestStatus} from '@app/services/store-features';

export const CheckResultDetailStore = signalStore(
  {providedIn: 'root'},
  withRequestStatus(),
  withState<{
    checkResult: BackendType['CheckResultResponse'] | undefined;
  }>({
    checkResult: undefined,
  }),
  withMethods((store, api = injectAPI()) => ({
    loadById: rxMethod<string | undefined>(
      pipe(
        filter((it): it is string => !!it),
        distinctUntilChanged(),
        tap(() => patchState(store, setPending(), () => ({checkResult: undefined}))),
        switchMap((id) =>
          api
            .get('/v1/check-result/{id}', {
              params: {
                path: {
                  id,
                },
              },
            })
            .pipe(
              tapResponse({
                next: (checkResult) => patchState(store, () => ({checkResult}), setFulfilled()),
                error: (error) => patchState(store, setError(error)),
              }),
            ),
        ),
      ),
    ),
  })),
);
