import {inject} from '@angular/core';

import {filter, pipe, switchMap, tap} from 'rxjs';

import {translate} from '@jsverse/transloco';
import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withMethods, withState} from '@ngrx/signals';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import confetti from 'canvas-confetti';
import {toast} from 'ngx-sonner';

import {BackendType, injectAPI} from '@app/api';
import {setError, setFulfilled, setPending, withRequestStatus} from '@app/services/store-features';

import {JsonService} from '../json.service';

export const InstanceSettingsStore = signalStore(
  {providedIn: 'root'},
  withRequestStatus(),
  withState<{
    settings: BackendType['InstanceSettingsResponse'] | undefined;
  }>({
    settings: undefined,
  }),
  withMethods((store, api = injectAPI(), jsonService = inject(JsonService)) => ({
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
    setSupport: rxMethod<BackendType['InstanceSettingSupportDto']>(
      pipe(
        tap(() => patchState(store, setPending())),
        switchMap((body) =>
          api.put('/v1/instance-settings/support', {body}).pipe(
            tapResponse({
              next: (response) => {
                if (store.settings()?.supportLookup !== body.supportLookup) {
                  if (response.check) {
                    toast.success(translate('GitHub Sponsorship detected. Thank you very much!'));

                    confetti({
                      particleCount: 100,
                      spread: 160,
                      origin: {y: 0.6},
                    });
                    setTimeout(() => confetti.reset(), 3000);
                  } else if ((body.supportLookup?.length ?? 0) > 0) {
                    toast.error(translate('GitHub Sponsorship check failed.'));
                  }
                }

                patchState(store, () => ({settings: response.instanceSettings}), setFulfilled());
                jsonService.refresh();
              },
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
);
