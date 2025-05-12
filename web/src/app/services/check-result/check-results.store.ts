import {inject} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import {debounceTime, pipe, switchMap, tap} from 'rxjs';

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
    statuses: BackendType['CheckResultResponse']['status'][] | undefined;
  }>({
    monitorId: undefined,
    teamId: undefined,
    showDuplicates: true,
    statuses: undefined,
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
    setStatuses: rxMethod<BackendType['CheckResultResponse']['status'][]>(
      tap((statuses) => patchState(store, () => ({statuses}))),
    ),
    addCheckResult(checkResult: BackendType['CheckResultResponse']): void {
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
    },
    load: rxMethod<
      {
        teamId?: string;
        monitorId?: string;
        onlyChanges: boolean;
        statuses?: BackendType['CheckResultResponse']['status'][];
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
      pushService.checkResults$
        .pipe(takeUntilDestroyed())
        .subscribe((it) => store.addCheckResult(it));
    },
  }),
);
