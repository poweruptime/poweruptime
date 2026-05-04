import {computed} from '@angular/core';

import {debounceTime, filter, forkJoin, map, pipe, switchMap, tap} from 'rxjs';

import {translate} from '@jsverse/transloco';
import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withComputed, withMethods, withState} from '@ngrx/signals';
import {removeAllEntities, removeEntity, setEntities, withEntities} from '@ngrx/signals/entities';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {toast} from '@spartan-ng/brain/sonner';

import {BackendType, injectAPI} from '@app/api';
import {injectConfirmDialog$} from '@app/components';
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

export const StatusPagesStore = signalStore(
  withState<{
    teamId: string | undefined;
    search: string;
    deleted: boolean | undefined;
  }>({
    teamId: undefined,
    search: '',
    deleted: undefined,
  }),
  withRequestStatus(),
  withEntities<BackendType['StatusPageResponse']>(),
  withPaginatedTable<BackendType['StatusPageResponse']>({
    columnsToDisplay: ['name', 'slug', 'actions'],
    defaultSortBy: 'name',
  }),
  withSelection<BackendType['StatusPageResponse']>({
    find: (it) => it.slug,
  }),
  withComputed(({search}) => ({
    isSearching: computed(() => search().length > 0),
  })),
  withMethods((store, api = injectAPI(), confirmDialog$ = injectConfirmDialog$()) => {
    const load = rxMethod<
      {
        teamId: string | undefined;
        search?: string;
        deleted?: boolean;
      } & PaginationDto
    >(
      pipe(
        filter(({teamId}) => !!teamId),
        tap(({teamId}) => patchState(store, setPending(), () => ({teamId}))),
        debounceTime(275),
        switchMap(({teamId, search, ...query}) =>
          api
            .get('/v1/status-page', {
              params: {
                query: {
                  teamId: teamId!!,
                  name: search && search.length > 0 ? search : undefined,
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
                    resetSelection(),
                    setEntities(response.data, {selectId: (it) => it.slug}),
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
      setDeleted: rxMethod<boolean | undefined>(
        tap((deleted) => patchState(store, () => ({deleted}))),
      ),
      load,
      restoreSelection: rxMethod<void>(
        switchMap(() =>
          confirmDialog$(
            translate('general.confirmRestore.title'),
            translate('general.confirmRestore.description'),
          ).pipe(
            tap(() => patchState(store, setPending())),
            map(() => store.selection().map((it) => it.slug)),
            switchMap((ids) =>
              forkJoin(
                ids.map((id) => api.delete('/v1/status-page/{id}/undo', {params: {path: {id}}})),
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
      delete: rxMethod<string>(
        switchMap((id) =>
          confirmDialog$(translate('general.confirmDelete')).pipe(
            tap(() => patchState(store, setPending())),
            switchMap(() =>
              api.delete('/v1/status-page/{id}', {params: {path: {id}}}).pipe(
                tapResponse({
                  next: () => {
                    patchState(store, setFulfilled(), removeEntity(id));

                    load({
                      ...store.pageable(),
                      search: store.search(),
                      teamId: store.teamId(),
                    });

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
      ),
    };
  }),
);
