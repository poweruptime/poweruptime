import {debounceTime, pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withMethods, withState} from '@ngrx/signals';
import {rxMethod} from '@ngrx/signals/rxjs-interop';

import {BackendType, injectAPI} from '@app/api';
import {setError, setFulfilled, setPending, withRequestStatus} from '@app/services/store-features';

export const CheckResultsPingStore = signalStore(
  withState<{
    data: BackendType['PingTimelineResponse'] | undefined;
    monitorId: string | undefined;
  }>({
    data: undefined,
    monitorId: undefined,
  }),
  withRequestStatus(),
  withMethods((store, api = injectAPI()) => ({
    load: rxMethod<{
      monitorId: string;
      start: string;
      end: string;
      precision: number;
    }>(
      pipe(
        tap(({monitorId}) => patchState(store, setPending(), {monitorId})),
        debounceTime(275),
        switchMap((query) =>
          api.get('/v1/check-result/ping', {params: {query}}).pipe(
            tapResponse({
              next: (data) => patchState(store, setFulfilled(), {data}),
              error: (error) => patchState(store, setError(error)),
            }),
          ),
        ),
      ),
    ),
  })),
);
