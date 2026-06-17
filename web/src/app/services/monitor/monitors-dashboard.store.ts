import {inject} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import {debounceTime, filter, pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withHooks, withMethods, withState} from '@ngrx/signals';
import {rxMethod} from '@ngrx/signals/rxjs-interop';

import {BackendType, injectAPI} from '@app/api';
import {PushService} from '@app/services';

import {setError, setFulfilled, setPending, withRequestStatus} from '../store-features';

export const MonitorsDashboardStore = signalStore(
  withRequestStatus(),
  withState<{
    dashboard: BackendType['MonitorDashboardResponse'] | undefined;
    teamId: string | undefined;
  }>({
    dashboard: undefined,
    teamId: undefined,
  }),
  withMethods((store, api = injectAPI()) => ({
    update: rxMethod<void>(
      pipe(
        filter(() => !!store.teamId()),
        tap(() => patchState(store, setPending())),
        switchMap(() =>
          api
            .get('/v1/monitor/dashboard', {
              params: {query: {teamId: store.teamId()!!}},
            })
            .pipe(
              tapResponse({
                next: (dashboard) => patchState(store, {dashboard}, setFulfilled()),
                error: (error) => patchState(store, setError(error)),
              }),
            ),
        ),
      ),
    ),
    loadByTeamId: rxMethod<string | undefined>(
      pipe(
        tap((teamId) => patchState(store, setPending(), {teamId})),
        switchMap((teamId) =>
          api.get('/v1/monitor/dashboard', {params: {query: {teamId}}}).pipe(
            tapResponse({
              next: (dashboard) => patchState(store, setFulfilled(), {dashboard}),
              error: (error) => patchState(store, setError(error)),
            }),
          ),
        ),
      ),
    ),
  })),
  withHooks({
    onInit(store, pushService = inject(PushService)) {
      pushService.monitorStatusChange$
        .pipe(takeUntilDestroyed(), debounceTime(5000))
        .subscribe(() => store.update());
    },
  }),
);
