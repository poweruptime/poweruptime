import {inject} from '@angular/core';

import {filter, pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withMethods, withState} from '@ngrx/signals';
import {rxMethod} from '@ngrx/signals/rxjs-interop';

import {BackendType, injectAPI} from '@app/api';
import {setError, setFulfilled, setPending, withRequestStatus} from '@app/services/store-features';

import {InstanceSettingsStore} from './instance-settings.store';

export const InstanceSettingsVersionCheckStore = signalStore(
  {providedIn: 'root'},
  withRequestStatus(),
  withState<{versionCheck: BackendType['VersionCheckResponse'] | undefined}>({
    versionCheck: undefined,
  }),
  withMethods(
    (store, api = injectAPI(), instanceSettingsStore = inject(InstanceSettingsStore)) => ({
      makeVersionCheck: rxMethod<{versionCheckEnabled: boolean; skipCache?: boolean}>(
        pipe(
          filter((it) => it.versionCheckEnabled),
          tap(() => patchState(store, setPending())),
          switchMap(({skipCache}) =>
            api.get('/v1/instance-settings/versionCheck', {params: {query: {skipCache}}}).pipe(
              tapResponse({
                next: (versionCheck) => patchState(store, setFulfilled(), () => ({versionCheck})),
                error: (error) => patchState(store, setError(error)),
              }),
            ),
          ),
        ),
      ),
      setVersionCheck: rxMethod<BackendType['InstanceSettingVersionCheckDto']>(
        pipe(
          tap(() => patchState(store, setPending())),
          switchMap((body) =>
            api.put('/v1/instance-settings/versionCheck', {body}).pipe(
              tapResponse({
                next: (settings) => {
                  instanceSettingsStore.setSettings(settings);
                  patchState(store, setFulfilled());
                },
                error: (error) => patchState(store, setError(error)),
              }),
            ),
          ),
        ),
      ),
    }),
  ),
);
