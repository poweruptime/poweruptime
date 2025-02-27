import {computed} from '@angular/core';

import {debounceTime, filter, map, pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withComputed, withMethods, withState} from '@ngrx/signals';
import {removeAllEntities, removeEntity, setEntities, setEntity} from '@ngrx/signals/entities';
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

export const NotificationMethodsStore = signalStore(
  withState<{
    teamId: string | undefined;
    search: string;
    types: BackendType['NotificationMethodResponse']['sender']['_type'][];
    useByDefault: boolean | null;
  }>({
    teamId: undefined,
    search: '',
    types: [],
    useByDefault: null,
  }),
  withPaginatedTable<BackendType['NotificationMethodResponse']>({
    columnsToDisplay: ['name', 'sender._type', 'sender', 'useByDefault', 'actions'],
    defaultSortBy: 'name',
  }),
  withComputed(({search, types, useByDefault}) => ({
    isSearching: computed(() => search().length > 0 || types().length > 0 || useByDefault !== null),
  })),
  withMethods((store, api = injectAPI()) => {
    const load = rxMethod<
      {
        teamId: string | undefined;
        search: string;
        types: BackendType['NotificationMethodResponse']['sender']['_type'][];
        useByDefault: boolean | null;
      } & PaginationDto
    >(
      pipe(
        filter(({teamId}) => !!teamId),
        tap(({teamId}) => patchState(store, setPending(), () => ({teamId}))),
        debounceTime(400),
        switchMap(({teamId, search, types, useByDefault, page, size, sort}) =>
          api
            .get('/v1/notification-method', {
              params: {
                query: {
                  teamId: teamId!!,
                  page,
                  size,
                  sort,
                  name: search.length > 0 ? search : undefined,
                  types,
                  ...(useByDefault !== null ? {useByDefault} : {}),
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
      setTypes: rxMethod<BackendType['NotificationMethodResponse']['sender']['_type'][] | null>(
        pipe(
          map((it) => it ?? []),
          tap((types) => patchState(store, () => ({types}))),
        ),
      ),
      setUseByDefault: rxMethod<BackendType['NotificationMethodResponse']['useByDefault'] | null>(
        tap((useByDefault) => patchState(store, () => ({useByDefault}))),
      ),
      load,
      delete: rxMethod<string>(
        pipe(
          tap(() => patchState(store, setPending())),
          switchMap((id) =>
            api.delete('/v1/notification-method/{id}', {params: {path: {id}}}).pipe(
              tapResponse({
                next: () => {
                  patchState(store, setFulfilled(), removeEntity(id));

                  toast.success('Successfully deleted notification method.', {
                    action: {
                      label: 'Undo',
                      onClick: () =>
                        api
                          .delete('/v1/notification-method/{id}/undo', {params: {path: {id}}})
                          .pipe(
                            tapResponse({
                              next: (notificationMethod) => {
                                load({
                                  ...store.pageable(),
                                  teamId: store.teamId(),
                                  search: store.search(),
                                  types: store.types(),
                                  useByDefault: store.useByDefault(),
                                });

                                toast.success(`Successfully restored ${notificationMethod.name}.`);
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
