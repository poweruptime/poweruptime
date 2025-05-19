import {inject} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import {debounceTime, distinctUntilChanged, filter, pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {
  patchState,
  signalStoreFeature,
  type,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import {
  removeAllEntities,
  setAllEntities,
  updateEntity,
  withEntities,
} from '@ngrx/signals/entities';
import {rxMethod} from '@ngrx/signals/rxjs-interop';

import {BackendType, MonitorDataType, injectAPI} from '@app/api';
import {PushService} from '@app/services';
import {
  PaginationDto,
  RequestStatusState,
  resetSelection,
  setError,
  setFulfilled,
  setPending,
  setTotalElements,
  withPaginatedTable,
  withRequestStatus,
  withSelection,
} from '@app/services/store-features';

export type MonitorSearchParams = {
  search: string | undefined;
  statuses: BackendType['MonitorResponse']['status'][] | undefined;
  types: BackendType['MonitorData']['_type'][] | undefined;
  tags: string[] | undefined;
};

export function withMonitorsLoad() {
  return signalStoreFeature(
    withState<{teamId: string | undefined}>({teamId: undefined}),
    withRequestStatus(),
    withEntities<BackendType['MonitorResponse']>(),
    withPaginatedTable<BackendType['MonitorResponse']>({
      paramPrefix: 'monitors.',
      columnsToDisplay: ['name', 'status', 'checkResults', 'actions'],
      defaultSortBy: 'status',
      defaultSortDirection: 'asc',
    }),
    withSelection<BackendType['MonitorResponse']>({}),
    withMethods((store, api = injectAPI()) => ({
      updateMonitor(it: BackendType['MonitorResponse']): void {
        patchState(store, updateEntity({id: it.id, changes: it}));
      },
      addCheckResult(checkResult: BackendType['CheckResultResponse']): void {
        const monitor = store.entities().find((it) => it.id === checkResult.monitor.id);

        if (monitor) {
          patchState(
            store,
            updateEntity({
              id: monitor.id,
              changes: {
                lastCheckResults: [checkResult, ...monitor.lastCheckResults.slice(0, 19)],
              },
            }),
          );
        }
      },
      load: rxMethod<
        {
          teamId?: string;
          search?: string;
          statuses?: BackendType['MonitorResponse']['status'][];
          types?: MonitorDataType[];
          tags?: string[];
          deleted?: boolean;
        } & PaginationDto
      >(
        pipe(
          distinctUntilChanged((prev, cur) => {
            if (
              prev.search !== cur.search ||
              prev.statuses !== cur.statuses ||
              prev.types !== cur.types ||
              prev.tags !== cur.tags
            ) {
              patchState(store, removeAllEntities(), () => ({page: 0}));
              return false;
            }

            return prev.page === cur.page && prev.teamId === cur.teamId;
          }),
          tap(({teamId}) =>
            patchState(
              store,
              setPending(),
              store.teamId() !== teamId ? removeAllEntities() : () => ({}),
              () => ({teamId}),
            ),
          ),
          debounceTime(275),
          switchMap(({search, ...query}) =>
            api
              .get('/v1/monitor', {
                params: {
                  query: {
                    ...query,
                    name: search && search.length > 0 ? search : undefined,
                  },
                },
              })
              .pipe(
                tapResponse({
                  next: (response) =>
                    patchState(
                      store,
                      resetSelection(),
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
        pushService.monitorStatusChange$
          .pipe(takeUntilDestroyed())
          .subscribe((it) => store.updateMonitor(it));

        pushService.checkResults$
          .pipe(takeUntilDestroyed())
          .subscribe((it) => store.addCheckResult(it));
      },
    }),
  );
}

export function withMonitorLoad() {
  return signalStoreFeature(
    {state: type<RequestStatusState>()},
    withState<{monitor: BackendType['MonitorMaxResponse'] | undefined}>({monitor: undefined}),
    withMethods((store, api = injectAPI()) => ({
      loadMonitorById: rxMethod<string | undefined>(
        pipe(
          filter((it): it is string => !!it),
          distinctUntilChanged(),
          tap(() => patchState(store, setPending(), () => ({monitor: undefined}))),
          switchMap((id) =>
            api
              .get('/v1/monitor/{id}', {
                params: {
                  path: {
                    id,
                  },
                },
              })
              .pipe(
                tapResponse({
                  next: (monitor) => patchState(store, () => ({monitor}), setFulfilled()),
                  error: (error) => patchState(store, setError(error)),
                }),
              ),
          ),
        ),
      ),
    })),
  );
}
