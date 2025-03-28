import {computed, inject} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import {
  debounceTime,
  distinctUntilChanged,
  filter,
  forkJoin,
  map,
  mergeMap,
  pipe,
  switchMap,
  tap,
} from 'rxjs';

import {translate} from '@jsverse/transloco';
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
  addEntity,
  removeAllEntities,
  removeEntity,
  setAllEntities,
  setEntities,
  setEntity,
  updateEntity,
  withEntities,
} from '@ngrx/signals/entities';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {toast} from 'ngx-sonner';

import {BackendType, injectAPI} from '@app/api';
import {injectConfirmDialog$} from '@app/components';
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

const pageSize = 15;

export const InfiniteMonitorsStore = signalStore(
  withState<{
    page: number;
    requestCount: number;
    loadedAll: Set<string | undefined>;
    teamId: string | undefined;
  }>({
    page: 0,
    requestCount: 0,
    loadedAll: new Set<string | undefined>(),
    teamId: undefined,
  }),
  withEntities<BackendType['MonitorResponse']>(),
  withComputed(({requestCount, entities}) => ({
    isPending: computed(() => requestCount() > 0),
    sortedEntities: computed(() =>
      entities().sort((a, b) => {
        if (a.status < b.status) {
          return -1;
        } else if (a.status > b.status) {
          return 1;
        } else {
          return a.name.toLowerCase().localeCompare(b.name.toLowerCase(), undefined, {
            numeric: true,
            sensitivity: 'base',
          });
        }
      }),
    ),
  })),
  withMethods((store, api = injectAPI()) => ({
    nextPage(teamId: string | undefined): void {
      if (!store.loadedAll().has(teamId)) {
        patchState(store, (state) => ({page: state.page + 1}));
      }
    },
    addMonitor(it: BackendType['MonitorResponse']): void {
      patchState(store, addEntity(it));
    },
    updateMonitor(it: BackendType['MonitorResponse']): void {
      // Add or update the entity in the store so it always ends up in the list
      // If another status, only update it if its already in the loaded list
      if (it.status === 'DOWN') {
        patchState(store, setEntity(it));
      } else {
        patchState(store, updateEntity({id: it.id, changes: it}));
      }
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
    removeMonitor(id: string): void {
      patchState(store, removeEntity(id));
    },
    loadMonitorsByTeamId: rxMethod<{
      teamId: string | undefined;
      page: number;
    }>(
      pipe(
        distinctUntilChanged((prev, cur) => {
          if (prev.teamId !== cur.teamId) {
            patchState(store, removeAllEntities(), (state) => {
              state.loadedAll.delete(cur.teamId);
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
        tap(({teamId}) =>
          patchState(store, (state) => ({
            teamId,
            requestCount: state.requestCount + 1,
          })),
        ),
        mergeMap(({teamId, page}) =>
          api
            .get('/v1/monitor', {
              params: {
                query: {
                  teamId,
                  page,
                  size: pageSize,
                  sort: ['status,ASC', 'name,ASC,ignorecase'],
                },
              },
            })
            .pipe(
              tap(() =>
                patchState(store, (state) => ({
                  requestCount: state.requestCount - 1,
                })),
              ),
              filter(() => {
                if (store.teamId() === teamId) {
                  return true;
                }
                console.warn('Team id changed after fetching its monitors', store.teamId(), teamId);
                return false;
              }),
              tapResponse({
                next: (response) => {
                  patchState(store, setEntities(response.data), (state) => {
                    if (response.numberOfPages === page && state.requestCount === 0) {
                      console.warn(`Team ${teamId} has loaded all items`);
                      state.loadedAll.add(teamId);
                      return {loadedAll: state.loadedAll};
                    }
                    return {};
                  });
                },
                error: (error) => {
                  console.error(error);
                  toast.error(`Error while loading monitors page ${page}`);
                },
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

export type MonitorSearchParams = {
  search: string;
  statuses: BackendType['MonitorResponse']['status'][];
  types: BackendType['MonitorCheckerData']['_type'][];
};

export const MonitorsSearchStore = signalStore(
  withState<{page: number} & MonitorSearchParams>({page: 0, search: '', statuses: [], types: []}),
  withRequestStatus(),
  withEntities<BackendType['MonitorResponse']>(),
  withComputed(({search, statuses, types}) => ({
    isSearching: computed(() => search().length > 0 || statuses().length > 0 || types().length > 0),
  })),
  withMethods((store, api = injectAPI()) => ({
    nextPage(): void {
      patchState(store, (state) => ({page: state.page + 1}));
    },
    setSearch: rxMethod<string | null | undefined>(
      pipe(
        map((it) => it ?? ''),
        tap((search) => patchState(store, () => ({search}))),
      ),
    ),
    setStatuses: rxMethod<MonitorSearchParams['statuses'] | null | undefined>(
      pipe(
        map((it) => it ?? []),
        tap((statuses) => patchState(store, () => ({statuses}))),
      ),
    ),
    setTypes: rxMethod<MonitorSearchParams['types'] | null | undefined>(
      pipe(
        map((it) => it ?? []),
        tap((types) => patchState(store, () => ({types}))),
      ),
    ),
    updateMonitor(it: Partial<BackendType['MonitorMinResponse']>): void {
      patchState(store, updateEntity({id: it.id!!, changes: it}));
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
    removeMonitor(id: string): void {
      patchState(store, removeEntity(id));
    },
    searchMonitorsByTeamId: rxMethod<
      {
        teamId: string | undefined;
        page: number;
      } & MonitorSearchParams
    >(
      pipe(
        filter((it) => it.search.length > 0 || it.statuses.length > 0 || it.types.length > 0),
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
        tap(() => patchState(store, setPending())),
        debounceTime(400),
        mergeMap(({page, teamId, search, statuses, types}) =>
          api
            .get('/v1/monitor', {
              params: {
                query: {
                  teamId,
                  page,
                  size: pageSize,
                  sort: ['name,asc,ignorecase'],
                  name: search.length > 0 ? search : undefined,
                  statuses,
                  types,
                },
              },
            })
            .pipe(
              tapResponse({
                next: (response) => patchState(store, setEntities(response.data), setFulfilled()),
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

export const MonitorsStore = signalStore(
  withState<{
    teamId: string | undefined;
    deleted: boolean | undefined;
  }>({
    teamId: undefined,
    deleted: undefined,
  }),
  withPaginatedTable<BackendType['MonitorResponse']>({
    paramPrefix: 'monitors.',
    columnsToDisplay: ['name', 'status', 'checkResults', 'actions'],
    defaultSortBy: 'status',
    defaultSortDirection: 'asc',
  }),
  withSelection<BackendType['MonitorResponse']>({}),
  withMethods((store, api = injectAPI(), confirmDialog$ = injectConfirmDialog$()) => {
    const load = rxMethod<
      {
        teamId: string | undefined;
        deleted?: boolean;
      } & PaginationDto
    >(
      pipe(
        tap(({teamId}) =>
          patchState(
            store,
            setPending(),
            store.teamId() !== teamId ? removeAllEntities() : () => ({}),
            () => ({teamId}),
          ),
        ),
        debounceTime(400),
        switchMap((query) =>
          api
            .get('/v1/monitor', {
              params: {query},
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
    );

    return {
      setDeleted: rxMethod<boolean | undefined>(
        tap((deleted) => patchState(store, () => ({deleted}))),
      ),
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
      restoreSelection: rxMethod<void>(
        switchMap(() =>
          confirmDialog$(
            translate('general.confirmRestore.title'),
            translate('general.confirmRestore.description'),
          ).pipe(
            tap(() => patchState(store, setPending())),
            map(() => store.selection().map((it) => it.id)),
            switchMap((ids) =>
              forkJoin(
                ids.map((id) => api.delete('/v1/monitor/{id}/undo', {params: {path: {id}}})),
              ).pipe(
                tapResponse({
                  next: () => {
                    toast.success(translate('general.restoreSuccess'));

                    load({
                      ...store.pageable(),
                      deleted: store.deleted(),
                      teamId: store.teamId(),
                    });
                  },
                  error: (error) => patchState(store, setError(error)),
                }),
              ),
            ),
          ),
        ),
      ),
      load,
    };
  }),
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
