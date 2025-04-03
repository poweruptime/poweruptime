import {computed, inject} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import {debounceTime, distinctUntilChanged, map, pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {
  patchState,
  signalStoreFeature,
  withComputed,
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

import {BackendType, injectAPI} from '@app/api';
import {PushService} from '@app/services';
import {
  PaginationDto,
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
  types: BackendType['MonitorCheckerData']['_type'][] | undefined;
};

export function withMonitorsLoad() {
  return signalStoreFeature(
    withState<
      {
        teamId: string | undefined;
        deleted: boolean | undefined;
      } & MonitorSearchParams
    >({
      teamId: undefined,
      search: undefined,
      statuses: undefined,
      types: undefined,
      deleted: undefined,
    }),
    withRequestStatus(),
    withEntities<BackendType['MonitorResponse']>(),
    withPaginatedTable<BackendType['MonitorResponse']>({
      paramPrefix: 'monitors.',
      columnsToDisplay: ['name', 'status', 'checkResults', 'actions'],
      defaultSortBy: 'status',
      defaultSortDirection: 'asc',
    }),
    withSelection<BackendType['MonitorResponse']>({}),
    withComputed(({search, types, statuses}) => ({
      isSearching: computed(
        () =>
          (search() && search()!.length > 0) ||
          (statuses() && statuses()!.length > 0) ||
          (types() && types()!.length > 0),
      ),
    })),
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
      setSearch: rxMethod<string | null | undefined>(
        pipe(
          map((it) => it ?? undefined),
          tap((search) => patchState(store, () => ({search}))),
        ),
      ),
      setStatuses: rxMethod<BackendType['MonitorResponse']['status'][] | null | undefined>(
        pipe(
          map((it) => it ?? undefined),
          tap((statuses) => patchState(store, () => ({statuses}))),
        ),
      ),
      setTypes: rxMethod<BackendType['MonitorCheckerData']['_type'][] | null | undefined>(
        pipe(
          map((it) => it ?? undefined),
          tap((types) => patchState(store, () => ({types}))),
        ),
      ),
      setDeleted: rxMethod<boolean | undefined>(
        tap((deleted) => patchState(store, () => ({deleted}))),
      ),
      load: rxMethod<
        {
          teamId?: string;
          search?: string;
          statuses?: BackendType['MonitorResponse']['status'][];
          types?: BackendType['MonitorCheckerData']['_type'][];
          deleted?: boolean;
        } & PaginationDto
      >(
        pipe(
          distinctUntilChanged((prev, cur) => {
            if (
              prev.search !== cur.search ||
              prev.statuses !== cur.statuses ||
              prev.types !== cur.types
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
          debounceTime(400),
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
