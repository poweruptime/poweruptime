import {computed, inject} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import {forkJoin, map, mergeMap, pipe, switchMap, tap} from 'rxjs';

import {translate} from '@jsverse/transloco';
import {tapResponse} from '@ngrx/operators';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import {
  addEntity,
  removeEntity,
  setEntities,
  setEntity,
  updateEntity,
  withEntities,
} from '@ngrx/signals/entities';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {toast} from '@spartan-ng/brain/sonner';
import {linkedQueryParam} from 'ngxtension/linked-query-param';

import {BackendType, MonitorDataType, injectAPI} from '@app/api';
import {injectConfirmDialog$} from '@app/components';
import {PushService} from '@app/services';
import {withMonitorsLoad} from '@app/services/monitor/monitors.feature';
import {setError, setPending} from '@app/services/store-features';

import {arrayToParam, paramToArray} from '../../util';

const pageSize = 15;
const defaultPage = 0;

export const InfiniteMonitorsStore = signalStore(
  {providedIn: 'root'},
  withState<{
    pages: Map<string | undefined, number>;
    requestCount: number;
    loadedAll: Set<string | undefined>;
    teamId: string | undefined;
  }>({
    pages: new Map(),
    requestCount: 0,
    loadedAll: new Set<string | undefined>(),
    teamId: undefined,
  }),
  withEntities<BackendType['MonitorResponse']>(),
  withComputed(({requestCount, entities, teamId, pages}) => ({
    isPending: computed(() => requestCount() > 0),
    page: computed(() => pages().get(teamId()) ?? defaultPage),
    sortedEntities: computed(() =>
      entities()
        .filter((it) => (teamId() === undefined ? true : teamId() === it.team.id))
        .sort((a, b) => {
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
      if (store.loadedAll().has(teamId)) {
        return;
      }

      patchState(store, ({pages}) => {
        pages.set(teamId, (pages.get(teamId) ?? defaultPage) + 1);

        return {
          pages: new Map(pages),
        };
      });
    },
    addMonitor(it: BackendType['MonitorResponse']): void {
      patchState(store, addEntity(it));
    },
    updateMonitor(it: BackendType['MonitorResponse']): void {
      // Add or update the entity in the store so it always ends up in the list
      // If another status, only update it if its already in the loaded list
      if (it.status === 'DOWN') {
        patchState(store, setEntity(it));
        return;
      }

      patchState(store, updateEntity({id: it.id, changes: it}));
    },
    removeMonitor(id: string): void {
      patchState(store, removeEntity(id));
    },
    loadMonitorsByTeamId: rxMethod<{
      teamId: string | undefined;
      page: number;
    }>(
      pipe(
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
                  sort: ['status_asc', 'name_asc'],
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
                next: (response) => {
                  patchState(store, setEntities(response.data), (state) => {
                    if (page >= response.numberOfPages && state.requestCount === 0) {
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
    },
  }),
);

export const MonitorsSearchStore = signalStore(
  withMonitorsLoad(),
  withProps(() => ({
    searchFilter: linkedQueryParam('search.name', {
      stringify: (value) => (value.length > 0 ? value : null),
    }),
    statusesFilter: linkedQueryParam('search.status', {
      parse: paramToArray<BackendType['MonitorResponse']['status']>(),
      stringify: arrayToParam(),
    }),
    typesFilter: linkedQueryParam('search.type', {
      parse: paramToArray<MonitorDataType>(),
      stringify: arrayToParam(),
    }),
    tagsFilter: linkedQueryParam('search.tag', {
      parse: paramToArray<string>(),
      stringify: arrayToParam(),
    }),
  })),
  withComputed(({searchFilter, statusesFilter, typesFilter, tagsFilter}) => ({
    isSearching: computed(
      () =>
        (searchFilter() && searchFilter()!.length > 0) ||
        (statusesFilter() && statusesFilter()!.length > 0) ||
        (typesFilter() && typesFilter()!.length > 0) ||
        (tagsFilter() && tagsFilter()!.length > 0),
    ),
  })),
  withMethods((store) => ({
    nextPage(): void {
      patchState(store, (state) => ({page: state.page + 1}));
    },
    removeMonitor(id: string): void {
      patchState(store, removeEntity(id));
    },
  })),
);

export const MonitorsStore = signalStore(
  withMonitorsLoad(),
  withMethods((store, api = injectAPI(), confirmDialog$ = injectConfirmDialog$()) => ({
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

                  store.load({
                    ...store.pageable(),
                    deleted: true,
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
  })),
);
