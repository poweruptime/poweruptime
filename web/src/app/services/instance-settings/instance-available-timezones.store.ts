import {pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withMethods, withState} from '@ngrx/signals';
import {rxMethod} from '@ngrx/signals/rxjs-interop';

import {BackendType, injectAPI} from '@app/api';
import {setError, setFulfilled, setPending, withRequestStatus} from '@app/services/store-features';

export const InstanceAvailableTimezonesStore = signalStore(
  {providedIn: 'root'},
  withRequestStatus(),
  withState<{
    availableTimezones:
      | BackendType['InstanceAvailableTimezonesResponse']['availableTimezones']
      | undefined;
  }>({
    availableTimezones: undefined,
  }),
  withMethods((store, api = injectAPI()) => ({
    load: rxMethod<void>(
      pipe(
        tap(() => patchState(store, setPending())),
        switchMap(() =>
          api.get('/v1/instance-settings/timezones').pipe(
            tapResponse({
              next: (dto) =>
                patchState(
                  store,
                  () => ({availableTimezones: dto.availableTimezones}),
                  setFulfilled(),
                ),
              error: (error) => patchState(store, setError(error)),
            }),
          ),
        ),
      ),
    ),
  })),
);
