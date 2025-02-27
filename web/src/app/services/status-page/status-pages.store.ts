import {computed} from '@angular/core';

import {debounceTime, filter, map, pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withComputed, withMethods, withState} from '@ngrx/signals';
import {removeAllEntities, removeEntity, setEntities} from '@ngrx/signals/entities';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {toast} from 'ngx-sonner';

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
    teamId: string | undefined;
    search: string;
  }>({
    teamId: undefined,
    search: '',
  }),
  withPaginatedTable<BackendType['StatusPageResponse']>({
    columnsToDisplay: ['name', 'slug', 'actions'],
    defaultSortBy: 'name',
  }),
  withComputed(({search}) => ({
    isSearching: computed(() => search().length > 0),
  })),
  withMethods((store, api = injectAPI()) => {
    const load = rxMethod<
      {
        teamId: string | undefined;
        search: string;
      } & PaginationDto
    >(
      pipe(
        filter(({teamId}) => !!teamId),
        tap(({teamId}) => patchState(store, setPending(), () => ({teamId}))),
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
    );

    return {
      setSearch: rxMethod<string | null>(
        pipe(
          map((it) => it ?? ''),
          tap((search) => patchState(store, () => ({search}))),
        ),
      ),
      load,
      delete: rxMethod<string>(
        pipe(
          tap(() => patchState(store, setPending())),
          switchMap((id) =>
            api.delete('/v1/status-page/{id}', {params: {path: {id}}}).pipe(
              tapResponse({
                next: () => {
                  patchState(store, setFulfilled(), removeEntity(id));

                  toast.success('Successfully deleted status page.', {
                    action: {
                      label: 'Undo',
                      onClick: () =>
                        api
                          .delete('/v1/status-page/{id}/undo', {params: {path: {id}}})
                          .pipe(
                            tapResponse({
                              next: (statusPage) => {
                                load({
                                  ...store.pageable(),
                                  search: store.search(),
                                  teamId: store.teamId(),
                                });

                                toast.success(`Successfully restored ${statusPage.name}.`);
                              },
                              error: (error) => patchState(store, setError(error)),
                            }),
                          )
                          .subscribe(),
                    },
                  });
                },
                error: (error) => patchState(store, setError(error)),
              }),
            ),
          ),
        ),
      ),
    };
  }),
);
