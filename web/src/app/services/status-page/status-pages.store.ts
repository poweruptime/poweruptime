import {computed} from '@angular/core';

import {debounceTime, filter, map, pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withComputed, withMethods, withState} from '@ngrx/signals';
import {
  removeAllEntities,
  removeEntity,
  setEntities,
  setEntity,
  updateEntity,
} from '@ngrx/signals/entities';
import {rxMethod} from '@ngrx/signals/rxjs-interop';

import {BackendType, injectAPI} from '@app/api';
import {
  PaginationDto,
  setError,
  setFulfilled,
  setPending,
  setTotalElements,
  withPaginatedTable,
} from '@app/services/store-features';

export const StatusPagesStore = signalStore(
  withState<{
    search: string;
  }>({
    search: '',
  }),
  withPaginatedTable<BackendType['StatusPageResponse']>({
    columnsToDisplay: ['name', 'slug', 'actions'],
    defaultSortBy: 'name',
  }),
  withComputed(({search}) => ({
    isSearching: computed(() => search().length > 0),
  })),
  withMethods((store, api = injectAPI()) => ({
    setSearch: rxMethod<string | null>(
      pipe(
        map((it) => it ?? ''),
        tap((search) => patchState(store, () => ({search}))),
      ),
    ),
    addStatusPage(it: BackendType['StatusPageResponse']): void {
      patchState(store, setEntity(it));
    },
    updateStatusPage(it: Partial<BackendType['StatusPageResponse']>): void {
      patchState(store, updateEntity({id: it.id!!, changes: it}));
    },
    removeStatusPage(id: string): void {
      patchState(store, removeEntity(id));
    },
    load: rxMethod<
      {
        teamId: string | undefined;
        search: string;
      } & PaginationDto
    >(
      pipe(
        filter((it) => !!it.teamId),
        tap(() => patchState(store, setPending())),
        debounceTime(400),
        switchMap(({teamId, search, ...query}) =>
          api
            .get('/v1/status-page', {
              params: {
                query: {
                  teamId: teamId!!,
                  name: search.length > 0 ? search : undefined,
                  ...query,
                },
              },
            })
            .pipe(
              tapResponse({
                next: (response) =>
                  patchState(
                    store,
                    removeAllEntities(),
                    setEntities(response.data),
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
);
