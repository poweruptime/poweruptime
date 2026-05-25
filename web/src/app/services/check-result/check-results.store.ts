import {inject} from '@angular/core';

import {EMPTY, debounceTime, filter, from, mergeMap, pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withHooks, withMethods, withState} from '@ngrx/signals';
import {removeAllEntities, setAllEntities, withEntities} from '@ngrx/signals/entities';
import {rxMethod} from '@ngrx/signals/rxjs-interop';

import {BackendType, injectAPI} from '@app/api';
import {PushService} from '@app/services';
import {
  PaginationDto,
  setError,
  setFulfilled,
  setPending,
  setTotalElements,
  withPaginatedTable,
  withRequestStatus,
} from '@app/services/store-features';

export const CheckResultsStore = signalStore(
  withState<{
    monitorId: string | undefined;
    teamId: string | undefined;
    showDuplicates: boolean;
  }>({
    monitorId: undefined,
    teamId: undefined,
    showDuplicates: true,
  }),
  withRequestStatus(),
  withEntities<BackendType['CheckResultResponse']>(),
  withPaginatedTable<BackendType['CheckResultResponse']>({
    paramPrefix: 'checks.',
    columnsToDisplay: ['status', 'createdAt', 'title', 'actions'],
    defaultSortBy: 'createdAt',
    defaultSortDirection: 'desc',
  }),
  withMethods((store, api = injectAPI()) => ({
    setShowDuplicates: rxMethod<boolean | null>(
      tap((showDuplicates) => patchState(store, () => ({showDuplicates: showDuplicates ?? false}))),
    ),
    addCheckResult: rxMethod<BackendType['CheckResultResponse']>(
      tap((checkResult) => {
        // 1) must be the right monitor (or, if no monitor selected, the right team)
        const isCorrectMonitorOrTeam =
          store.monitorId() === checkResult.monitor.id ||
          (store.monitorId() === undefined && store.teamId() === checkResult.team.id);
        if (!isCorrectMonitorOrTeam) return;

        // 2) only on the first page, sorted by createdAt
        if (store.page() !== 0 || store.sortBy() !== 'createdAt') return;

        // 3) either show duplicates or a real status change
        const isNewStatus = checkResult.status !== checkResult.previousStatus;
        if (!store.showDuplicates() && !isNewStatus) return;

        const trimmed = store
          .entities()
          .slice(0, Math.max(store.size() - 1, store.entities().length - 1));
        patchState(store, setAllEntities([checkResult, ...trimmed]));
      }),
    ),
    load: rxMethod<
      {
        teamId?: string;
        monitorId?: string;
        onlyChanges: boolean;
        hasNotification?: boolean;
        statuses?: BackendType['CheckResultResponse']['status'][];
        start?: string;
        end?: string;
      } & PaginationDto
    >(
      pipe(
        tap(({monitorId, teamId}) =>
          patchState(
            store,
            setPending(),
            store.monitorId() !== monitorId || store.teamId() !== teamId
              ? removeAllEntities()
              : () => ({}),
            () => ({monitorId, teamId}),
          ),
        ),
        debounceTime(275),
        switchMap((query) =>
          api.get('/v1/check-result', {params: {query}}).pipe(
            tapResponse({
              next: (response) =>
                patchState(
                  store,
                  setAllEntities(response.data),
                  setTotalElements(response.numberOfItems),
                  setFulfilled(),
                ),
              error: (error) => patchState(store, setError(error)),
            }),
          ),
        ),
      ),
    ),
  })),
  withHooks({
    onInit(store, pushService = inject(PushService)) {
      store.addCheckResult(pushService.checkResults$);
    },
  }),
);

const CACHE_DURATION_MS = 60_000; // 1 minute

const PAGE_SIZE = 22;

const MAX_CONCURRENT_CHECK_RESULT_LOADS = 4;

export const LastCheckResultsStore = signalStore(
  {providedIn: 'root'},
  withState<{
    resultsMap: Map<string, BackendType['CheckResultResponse'][]>;
    loading: Set<string>;
    cacheTimestamps: Map<string, number>;
  }>({
    resultsMap: new Map(),
    loading: new Set<string>(),
    cacheTimestamps: new Map(),
  }),
  withMethods((store, api = injectAPI()) => ({
    addCheckResult: rxMethod<BackendType['CheckResultResponse']>(
      tap((checkResult) => {
        const monitorId = checkResult.monitor.id;
        const currentResults = store.resultsMap().get(monitorId) ?? [];
        const existingIndex = currentResults.findIndex((it) => it.id === checkResult.id);

        const updated = [...currentResults];

        if (existingIndex === -1) {
          updated.unshift(checkResult);
          updated.length = Math.min(updated.length, PAGE_SIZE);
        } else {
          updated[existingIndex] = checkResult;
        }

        patchState(store, () => ({
          resultsMap: new Map(store.resultsMap()).set(monitorId, updated),
        }));
      }),
    ),
    loadAll: rxMethod<string[]>(
      pipe(
        filter((ids) => ids.length > 0),
        mergeMap((monitorIds) => {
          const idsToLoad = monitorIds.filter((monitorId) => {
            const timestamp = store.cacheTimestamps().get(monitorId);
            const hasValidCache =
              store.resultsMap().has(monitorId) &&
              timestamp !== undefined &&
              Date.now() - timestamp < CACHE_DURATION_MS;

            return !hasValidCache;
          });

          if (idsToLoad.length === 0) {
            return EMPTY;
          }

          const newLoading = new Set(store.loading());
          idsToLoad.forEach((id) => newLoading.add(id));

          patchState(store, () => ({loading: newLoading}));

          return from(idsToLoad).pipe(
            mergeMap(
              (monitorId) =>
                api
                  .get('/v1/check-result', {
                    params: {
                      query: {
                        monitorId,
                        page: 0,
                        size: PAGE_SIZE,
                        sort: ['createdAt_desc'],
                      },
                    },
                  })
                  .pipe(
                    tapResponse({
                      next: (response) => {
                        const loading = new Set(store.loading());
                        loading.delete(monitorId);

                        patchState(store, () => ({
                          resultsMap: new Map(store.resultsMap()).set(monitorId, response.data),
                          cacheTimestamps: new Map(store.cacheTimestamps()).set(
                            monitorId,
                            Date.now(),
                          ),
                          loading,
                        }));
                      },
                      error: () => {
                        const loading = new Set(store.loading());
                        loading.delete(monitorId);
                        patchState(store, () => ({loading}));
                      },
                    }),
                  ),
              MAX_CONCURRENT_CHECK_RESULT_LOADS,
            ),
          );
        }),
      ),
    ),
  })),
  withHooks({
    onInit(store, pushService = inject(PushService)) {
      store.addCheckResult(pushService.checkResults$);
    },
  }),
);
