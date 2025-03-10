import {computed, inject} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import {distinctUntilChanged, mergeMap, pipe, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import {removeAllEntities, setAllEntities, setEntities, withEntities} from '@ngrx/signals/entities';
import {rxMethod} from '@ngrx/signals/rxjs-interop';

import {BackendType, injectAPI} from '@app/api';
import {PushService} from '@app/services';

export const InfiniteCheckResultsStore = signalStore(
  withState<{
    monitorId: string | undefined;
    page: number;
    requestCount: number;
    loadedAll: Set<string>;
  }>({
    monitorId: undefined,
    page: 0,
    requestCount: 0,
    loadedAll: new Set<string>(),
  }),
  withEntities<BackendType['CheckResultResponse']>(),
  withComputed(({requestCount}) => ({
    isPending: computed(() => requestCount() > 0),
  })),
  withMethods((store, api = injectAPI()) => ({
    nextPage(monitorId: string): void {
      if (!store.loadedAll().has(monitorId)) {
        patchState(store, (state) => ({page: state.page + 1}));
      }
    },
    addCheckResult(checkResult: BackendType['CheckResultResponse']): void {
      patchState(store, setAllEntities([checkResult, ...store.entities()]));
    },
    load: rxMethod<{monitorId: string; page: number}>(
      pipe(
        distinctUntilChanged((prev, cur) => {
          if (prev.monitorId !== cur.monitorId) {
            patchState(store, removeAllEntities(), (state) => {
              state.loadedAll.delete(cur.monitorId);
              return {
                page: 0,
                loadedAll: state.loadedAll,
              };
            });
            // DIRTY Editing the current object
            cur.page = 0;
            return false;
          }
          return prev.page === cur.page;
        }),
        tap(({monitorId}) =>
          patchState(store, (state) => ({requestCount: state.requestCount + 1, monitorId})),
        ),
        mergeMap((query) =>
          api
            .get('/v1/check-result', {
              params: {
                query: {
                  ...query,
                  size: 100,
                  sort: ['createdAt,desc'],
                },
              },
            })
            .pipe(
              tap(() =>
                patchState(store, (state) => ({
                  requestCount: state.requestCount - 1,
                })),
              ),
              tapResponse({
                next: (response) =>
                  patchState(store, setEntities(response.data), (state) => {
                    if (response.numberOfPages === query.page && state.requestCount === 0) {
                      console.warn(`Monitor ${query.monitorId} has loaded all check results`);
                      state.loadedAll.add(query.monitorId);
                      return {loadedAll: state.loadedAll};
                    }
                    return {};
                  }),
                error: () => {},
              }),
            ),
        ),
      ),
    ),
  })),
  withHooks({
    onInit(store, pushService = inject(PushService)) {
      pushService.checkResults$
        .pipe(takeUntilDestroyed())
        .subscribe((it) => store.addCheckResult(it));
    },
  }),
);
