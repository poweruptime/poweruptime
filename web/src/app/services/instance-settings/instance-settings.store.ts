import {filter, pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withHooks, withMethods, withState} from '@ngrx/signals';
import {rxMethod} from '@ngrx/signals/rxjs-interop';

import {BackendType, injectAPI} from '@app/api';
import {setError, setFulfilled, setPending, withRequestStatus} from '@app/services/store-features';

export const InstanceSettingsStore = signalStore(
  {providedIn: 'root'},
  withRequestStatus(),
  withState<{
    settings: BackendType['InstanceSettingsResponse'] | undefined;
  }>({
    settings: undefined,
  }),
  withMethods((store, api = injectAPI()) => ({
    setSettings(settings: BackendType['InstanceSettingsResponse']) {
      patchState(store, () => ({settings}));
    },
    load: rxMethod<void>(
      pipe(
        tap(() => patchState(store, setPending())),
        switchMap(() =>
          api.get('/v1/instance-settings').pipe(
            tapResponse({
              next: (settings) => patchState(store, () => ({settings}), setFulfilled()),
              error: (error) => patchState(store, setError(error)),
            }),
          ),
        ),
      ),
    ),
    setIsUserAllowedToCreateTeams: rxMethod<boolean | null>(
      pipe(
        filter((it): it is boolean => it !== null),
        tap(() => patchState(store, setPending())),
        switchMap((value) =>
          api.put('/v1/instance-settings/isUserAllowedToCreateTeams', {body: {value}}).pipe(
            tapResponse({
              next: (settings) => patchState(store, () => ({settings}), setFulfilled()),
              error: (error) => patchState(store, setError(error)),
            }),
          ),
        ),
      ),
    ),
    setTimezone: rxMethod<string | null>(
      pipe(
        filter((it): it is string => !!it),
        tap(() => patchState(store, setPending())),
        switchMap((value) =>
          api.put('/v1/instance-settings/timezone', {body: {value}}).pipe(
            tapResponse({
              next: (settings) => patchState(store, () => ({settings}), setFulfilled()),
              error: (error) => patchState(store, setError(error)),
            }),
          ),
        ),
      ),
    ),
    setRetention: rxMethod<BackendType['InstanceSettingRetentionDto']>(
      pipe(
        tap(() => patchState(store, setPending())),
        switchMap((body) =>
          api.put('/v1/instance-settings/retention', {body}).pipe(
            tapResponse({
              next: (settings) => patchState(store, () => ({settings}), setFulfilled()),
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
