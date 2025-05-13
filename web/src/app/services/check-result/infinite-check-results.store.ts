import {computed, inject} from '@angular/core';
import {takeUntilDestroyed, toObservable} from '@angular/core/rxjs-interop';

import {delayWhen, distinctUntilChanged, filter, mergeMap, pipe, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import {
  prependEntity,
  removeAllEntities,
  setEntities,
  setEntity,
  withEntities,
} from '@ngrx/signals/entities';
import {rxMethod} from '@ngrx/signals/rxjs-interop';

import {BackendType, injectAPI} from '@app/api';
import {PushService} from '@app/services';

import {setFulfilled, setPending, withRequestStatus} from '../store-features';

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
  withRequestStatus(),
  withEntities<BackendType['CheckResultResponse']>(),
  withComputed(({requestCount}) => ({
    isInfinitePending: computed(() => requestCount() > 0),
  })),
  withMethods((store, api = injectAPI()) => ({
    nextPage(monitorId: string): void {
      if (!store.loadedAll().has(monitorId)) {
        patchState(store, (state) => ({page: state.page + 1}));
      }
    },
    addCheckResult(checkResult: BackendType['CheckResultResponse']): void {
      if (store.monitorId() === checkResult.monitor.id) {
        patchState(store, prependEntity(checkResult), setEntity(checkResult));
      }
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
          patchState(
            store,
            (state) => ({requestCount: state.requestCount + 1, monitorId}),
            setPending(),
          ),
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
                  patchState(store, setEntities(response.data), setFulfilled(), (state) => {
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
      const entitiesLoaded = toObservable(store.isFulfilled).pipe(filter((it) => it));
      // Only start processing pushes when initial request has been fulfilled
      pushService.checkResults$
        .pipe(
          takeUntilDestroyed(),
          delayWhen(() => entitiesLoaded),
        )
        .subscribe((it) => store.addCheckResult(it));
    },
  }),
);
