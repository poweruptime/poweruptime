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

export const NotificationMethodsStore = signalStore(
  withState<{
    search: string;
    types: BackendType['NotificationMethodResponse']['sender']['_type'][];
    useByDefault: boolean | null;
  }>({
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
  withMethods((store, api = injectAPI()) => ({
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
    addNotificationMethod(it: BackendType['NotificationMethodResponse']): void {
      patchState(store, setEntity(it));
    },
    updateNotificationMethod(it: Partial<BackendType['NotificationMethodResponse']>): void {
      patchState(store, updateEntity({id: it.id!!, changes: it}));
    },
    removeNotificationMethod(id: string): void {
      patchState(store, removeEntity(id));
    },
    load: rxMethod<
      {
        teamId: string | undefined;
        search: string;
        types: BackendType['NotificationMethodResponse']['sender']['_type'][];
        useByDefault: boolean | null;
      } & PaginationDto
    >(
      pipe(
        filter((it) => !!it.teamId),
        tap(() => patchState(store, setPending())),
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
    ),
  })),
);
