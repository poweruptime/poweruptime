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
    showDuplicates: boolean;
    monitorId: string | undefined;
  }>({
    showDuplicates: true,
    monitorId: undefined,
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
    addCheckResult(checkResult: BackendType['CheckResultResponse']): void {
      if (!store.monitorId() || store.monitorId() === checkResult.monitor.id) {
        if (store.page() === 0 && store.sortBy() === 'createdAt') {
          if (store.showDuplicates() || checkResult.status !== checkResult.previousStatus) {
            patchState(
              store,
              setAllEntities([
                checkResult,
                ...store
                  .entities()
                  .slice(0, Math.max(store.size() - 1, store.entities().length - 1)),
              ]),
            );
          }
        }
      }
    },
    load: rxMethod<
      {
        teamId: string | undefined;
        monitorId: string | undefined;
        onlyChanges: boolean;
      } & PaginationDto
    >(
      pipe(
        tap(({monitorId}) =>
          patchState(
            store,
            setPending(),
            store.monitorId() !== monitorId ? removeAllEntities() : () => ({}),
            () => ({monitorId}),
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
