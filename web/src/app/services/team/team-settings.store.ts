import {distinctUntilChanged, filter, pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withMethods, withState} from '@ngrx/signals';
import {rxMethod} from '@ngrx/signals/rxjs-interop';

import {BackendType, injectAPI} from '@app/api';
import {setError, setFulfilled, setPending, withRequestStatus} from '@app/services/store-features';

export const TeamSettingsStore = signalStore(
  withRequestStatus(),
  withState<{
    teamId: string | undefined;
    settings: BackendType['TeamSettingsResponse'] | undefined;
  }>({
    teamId: undefined,
    settings: undefined,
  }),
  withMethods((store, api = injectAPI()) => ({
    load: rxMethod<string | undefined>(
      pipe(
        filter((it): it is string => !!it),
        distinctUntilChanged(),
        tap((teamId) => patchState(store, setPending(), () => ({teamId, settings: undefined}))),
        switchMap((teamId) =>
          api
            .get('/v1/team/{teamId}/setting', {
              params: {
                path: {
                  teamId,
                },
              },
            })
            .pipe(
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
        switchMap((it) =>
          api
            .put('/v1/team/{teamId}/setting/timezone', {
              params: {
                path: {
                  teamId: store.teamId()!!,
                },
              },
              body: {it},
            })
            .pipe(
              tapResponse({
                next: (settings) => patchState(store, () => ({settings}), setFulfilled()),
                error: (error) => patchState(store, setError(error)),
              }),
            ),
        ),
      ),
    ),
    setCheckResultRetentionPeriodInDays: rxMethod<number | null>(
      pipe(
        filter((it): it is number => !!it),
        tap(() => patchState(store, setPending())),
        switchMap((it) =>
          api
            .put('/v1/team/{teamId}/setting/checkResultRetentionPeriodInDays', {
              params: {
                path: {
                  teamId: store.teamId()!!,
                },
              },
              body: {it},
            })
            .pipe(
              tapResponse({
                next: (settings) => patchState(store, () => ({settings}), setFulfilled()),
                error: (error) => patchState(store, setError(error)),
              }),
            ),
        ),
      ),
    ),
    setCheckResultLogRetentionPeriodInDays: rxMethod<number | null>(
      pipe(
        filter((it): it is number => !!it),
        tap(() => patchState(store, setPending())),
        switchMap((it) =>
          api
            .put('/v1/team/{teamId}/setting/checkResultLogRetentionPeriodInDays', {
              params: {
                path: {
                  teamId: store.teamId()!!,
                },
              },
              body: {it},
            })
            .pipe(
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
