import {computed, effect, inject} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {Router} from '@angular/router';

import {debounceTime, distinctUntilChanged, filter, map, mergeMap, pipe, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {
  getState,
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
  setEntities,
  setEntity,
  updateEntity,
  withEntities,
} from '@ngrx/signals/entities';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {toast} from 'ngx-sonner';

import {BackendType, injectAPI} from '@app/api';
import {PushService} from '@app/services';
import {setError, setFulfilled, setPending, withRequestStatus} from '@app/services/store-features';

const pageSize = 15;

export const MonitorsStore = signalStore(
  {providedIn: 'root'},
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
