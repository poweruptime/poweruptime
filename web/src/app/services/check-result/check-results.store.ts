import {Injector, Signal, inject, isSignal} from '@angular/core';
import {takeUntilDestroyed, toObservable} from '@angular/core/rxjs-interop';

import {
  Subject,
  auditTime,
  defer,
  finalize,
  from,
  map,
  merge,
  mergeMap,
  of,
  pipe,
  switchMap,
  tap,
  timer,
  withLatestFrom,
} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withHooks, withMethods, withState} from '@ngrx/signals';
import {removeAllEntities, setAllEntities, withEntities} from '@ngrx/signals/entities';
import {rxMethod} from '@ngrx/signals/rxjs-interop';

import {BackendType, injectAPI} from '@app/api';
import {
  PaginationDto,
  setError,
  setFulfilled,
  setPending,
  setTotalElements,
  withPaginatedTable,
  withRequestStatus,
} from '@app/services/store-features';

import {PushService} from '../push.service';
import {newestCheckResults, reconcileCheckResults} from './check-results.util';

type CheckResult = BackendType['CheckResultResponse'];
type CheckResultsQuery = {
  teamId?: string;
  monitorId?: string;
  onlyChanges: boolean;
  hasNotification?: boolean;
  statuses?: CheckResult['status'][];
  start?: string;
  end?: string;
} & PaginationDto;

const CACHE_DURATION_MS = 60_000;
const PAGE_SIZE = 22;
const MAX_CONCURRENT_CHECK_RESULT_LOADS = 4;
// At most one reload per interval; unlike a debounce, a steady stream of updates cannot starve it.
const REFRESH_INTERVAL_MS = 1_000;

function matchesQuery(result: CheckResult, query: CheckResultsQuery): boolean {
  return (
    inQueryScope(result, query) &&
    (!query.onlyChanges || result.status !== result.previousStatus) &&
    (!query.statuses?.length || query.statuses.includes(result.status)) &&
    (!query.start || Date.parse(result.createdAt) >= Date.parse(query.start)) &&
    (!query.end || Date.parse(result.createdAt) <= Date.parse(query.end))
  );
}

function inQueryScope(
  item: {monitor: {id: string}; team: {id: string}},
  query: CheckResultsQuery,
): boolean {
  return query.monitorId !== undefined
    ? item.monitor.id === query.monitorId
    : query.teamId === undefined || item.team.id === query.teamId;
}

function sortKeyChanged(previous: CheckResult, next: CheckResult, sortBy: string): boolean {
  const key = sortBy as keyof CheckResult;
  return JSON.stringify(previous[key]) !== JSON.stringify(next[key]);
}

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
  withEntities<CheckResult>(),
  withPaginatedTable<CheckResult>({
    paramPrefix: 'checks.',
    columnsToDisplay: ['status', 'createdAt', 'title', 'actions'],
    defaultSortBy: 'createdAt',
    defaultSortDirection: 'desc',
  }),
  withMethods((store, api = injectAPI(), pushService = inject(PushService)) => {
    let activeQuery: CheckResultsQuery | undefined;
    // Pushes not yet covered by an applied snapshot, from the query start or the last applied snapshot on.
    let pendingUpdates: Map<string, CheckResult> | undefined;
    // Reloads the current page when a live update cannot be applied locally.
    const refresh$ = new Subject<void>();

    const isLivePage = () =>
      store.page() === 0 && store.sortBy() === 'createdAt' && store.sortDirection() === 'desc';

    return {
      setShowDuplicates: rxMethod<boolean | null>(
        tap((showDuplicates) => patchState(store, {showDuplicates: showDuplicates ?? false})),
      ),
      addCheckResult: rxMethod<CheckResult>(
        tap((checkResult) => {
          const query = activeQuery;
          if (!query) return;
          const existing = store.entityMap()[checkResult.id];
          if (checkResult.status === 'PENDING' && existing && existing.status !== 'PENDING') return;
          pendingUpdates?.set(checkResult.id, checkResult);

          if (existing) {
            const matches = matchesQuery(checkResult, query);
            // Update in place on historical pages too, without changing their order.
            patchState(
              store,
              setAllEntities(
                store
                  .entities()
                  .flatMap((result) =>
                    result.id === checkResult.id ? (matches ? [checkResult] : []) : [result],
                  ),
              ),
            );
            // The backend decides which result refills the page or where the moved row belongs.
            if (!matches || sortKeyChanged(existing, checkResult, store.sortBy())) refresh$.next();
          } else if (
            isLivePage() &&
            query.hasNotification === undefined &&
            matchesQuery(checkResult, query)
          ) {
            patchState(
              store,
              setAllEntities(newestCheckResults([checkResult, ...store.entities()], store.size())),
            );
          }
        }),
      ),
      refreshOnNotification: rxMethod<BackendType['NotificationResponse']>(
        tap((notification) => {
          const query = activeQuery;
          // Its check result now has a notification, which changes membership in notification-filtered tables.
          if (
            query?.hasNotification !== undefined &&
            inQueryScope(notification, query) &&
            (query.hasNotification || store.entityMap()[notification.checkResultId])
          ) {
            refresh$.next();
          }
        }),
      ),
      load: rxMethod<CheckResultsQuery>(
        pipe(
          tap((query) => {
            activeQuery = query;
            // Collect pushes during the debounce too; the first snapshot may not contain them yet.
            pendingUpdates = new Map();
            patchState(store, setPending(), removeAllEntities(), {
              monitorId: query.monitorId,
              teamId: query.teamId,
            });
          }),
          // Cancel the previous request immediately, including during the debounce period.
          switchMap((query) =>
            timer(275).pipe(
              switchMap(() =>
                merge(
                  timer(0, CACHE_DURATION_MS),
                  pushService.connected$,
                  refresh$.pipe(auditTime(REFRESH_INTERVAL_MS)),
                ).pipe(
                  switchMap(() =>
                    defer(() => {
                      // Reuse the map of a debounce or cancelled request so none of its pushes are lost.
                      const updates = pendingUpdates ?? new Map<string, CheckResult>();
                      pendingUpdates = updates;
                      return api.get('/v1/check-result', {params: {query}}).pipe(
                        tapResponse({
                          next: (response) => {
                            const snapshotIds = new Set(response.data.map((result) => result.id));
                            const liveUpdates = [...updates.values()].filter((result) =>
                              isLivePage() && query.hasNotification === undefined
                                ? true
                                : snapshotIds.has(result.id),
                            );
                            let results = reconcileCheckResults(
                              response.data,
                              store.entities(),
                              liveUpdates,
                            ).filter((result) => matchesQuery(result, query));
                            if (isLivePage()) results = newestCheckResults(results, query.size);
                            patchState(
                              store,
                              setAllEntities(results),
                              setTotalElements(response.numberOfItems),
                              setFulfilled(),
                            );
                            // Pushes from here on are newer than this snapshot. A failed or cancelled request
                            // keeps the map, so the next request still reconciles them.
                            if (pendingUpdates === updates) pendingUpdates = undefined;
                          },
                          error: (error) => patchState(store, setError(error)),
                        }),
                      );
                    }),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    };
  }),
  withHooks({
    onInit(store, pushService = inject(PushService)) {
      store.addCheckResult(pushService.checkResults$);
      store.refreshOnNotification(pushService.notifications$);
    },
  }),
);

export const LastCheckResultsStore = signalStore(
  {providedIn: 'root'},
  withState<{
    resultsMap: Map<string, CheckResult[]>;
    loading: Set<string>;
    cacheTimestamps: Map<string, number>;
  }>({
    resultsMap: new Map(),
    loading: new Set<string>(),
    cacheTimestamps: new Map(),
  }),
  withMethods((store, api = injectAPI(), pushService = inject(PushService)) => {
    const inFlightUpdates = new Map<string, Map<string, CheckResult>>();
    const refreshAfterLoad = new Set<string>();

    const loadAll = rxMethod<string[] | {monitorIds: string[]; force: boolean}>(
      pipe(
        map((request) => (Array.isArray(request) ? {monitorIds: request, force: false} : request)),
        mergeMap(({monitorIds, force}) => {
          const idsToLoad = [...new Set(monitorIds)].filter((monitorId) => {
            if (store.loading().has(monitorId)) {
              if (force && inFlightUpdates.has(monitorId)) refreshAfterLoad.add(monitorId);
              return false;
            }
            const timestamp = store.cacheTimestamps().get(monitorId);
            return force || timestamp === undefined || Date.now() - timestamp >= CACHE_DURATION_MS;
          });
          patchState(store, ({loading}) => ({loading: new Set([...loading, ...idsToLoad])}));
          return from(idsToLoad);
        }),
        // Apply the concurrency limit across all callers, including queued monitors.
        mergeMap(
          (monitorId) =>
            defer(() => {
              const updates = new Map<string, CheckResult>();
              inFlightUpdates.set(monitorId, updates);
              return api
                .get('/v1/check-result', {
                  params: {query: {monitorId, page: 0, size: PAGE_SIZE, sort: ['createdAt_desc']}},
                })
                .pipe(
                  tapResponse({
                    next: (response) =>
                      patchState(store, ({resultsMap, cacheTimestamps}) => ({
                        resultsMap: new Map(resultsMap).set(
                          monitorId,
                          newestCheckResults(
                            reconcileCheckResults(
                              response.data,
                              resultsMap.get(monitorId) ?? [],
                              updates.values(),
                            ),
                            PAGE_SIZE,
                          ),
                        ),
                        cacheTimestamps: new Map(cacheTimestamps).set(monitorId, Date.now()),
                      })),
                    error: () => {
                      // Keep the last snapshot; the next refresh will retry this monitor.
                    },
                  }),
                  finalize(() => {
                    inFlightUpdates.delete(monitorId);
                    patchState(store, ({loading}) => {
                      const remaining = new Set(loading);
                      remaining.delete(monitorId);
                      return {loading: remaining};
                    });
                    if (refreshAfterLoad.delete(monitorId))
                      loadAll({monitorIds: [monitorId], force: true});
                  }),
                );
            }),
          MAX_CONCURRENT_CHECK_RESULT_LOADS,
        ),
      ),
    );

    return {
      loadAll,
      // Pushes may have been missed while disconnected, so cached monitors must reload on their next use.
      invalidateCache: rxMethod<void>(tap(() => patchState(store, {cacheTimestamps: new Map()}))),
      addCheckResult: rxMethod<CheckResult>(
        tap((checkResult) => {
          const monitorId = checkResult.monitor.id;
          const current = store.resultsMap().get(monitorId) ?? [];
          const existing = current.find((result) => result.id === checkResult.id);
          if (checkResult.status === 'PENDING' && existing && existing.status !== 'PENDING') return;
          inFlightUpdates.get(monitorId)?.set(checkResult.id, checkResult);
          patchState(store, ({resultsMap}) => ({
            resultsMap: new Map(resultsMap).set(
              monitorId,
              newestCheckResults(
                [checkResult, ...current.filter((result) => result.id !== checkResult.id)],
                PAGE_SIZE,
              ),
            ),
          }));
        }),
      ),
      // Refresh only while the calling component is alive; the store itself is root-scoped.
      watch(monitorIds: string[] | Signal<string[]>): void {
        const injector = inject(Injector);
        const ids$ = isSignal(monitorIds) ? toObservable(monitorIds, {injector}) : of(monitorIds);
        merge(
          ids$.pipe(map((ids) => ({monitorIds: ids, force: false}))),
          merge(timer(CACHE_DURATION_MS, CACHE_DURATION_MS), pushService.connected$).pipe(
            withLatestFrom(ids$),
            map(([, ids]) => ({monitorIds: ids, force: true})),
          ),
        )
          .pipe(takeUntilDestroyed())
          .subscribe((request) => loadAll(request));
      },
    };
  }),
  withHooks({
    onInit(store, pushService = inject(PushService)) {
      store.addCheckResult(pushService.checkResults$);
      store.invalidateCache(pushService.connected$);
    },
  }),
);
