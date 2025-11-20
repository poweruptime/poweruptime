import {computed} from '@angular/core';

import {debounceTime, filter, map, pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStoreFeature, withComputed, withMethods, withState} from '@ngrx/signals';
import {setAllEntities, withEntities} from '@ngrx/signals/entities';
import {rxMethod} from '@ngrx/signals/rxjs-interop';

import {BackendType, injectAPI} from '@app/api';
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

export function withNotificationMethodsLoad() {
  return signalStoreFeature(
    withState<{
      teamId: string | undefined;
      search: string | undefined;
      types: BackendType['NotificationMethodResponse']['data']['_type'][] | undefined;
      usedByMonitorIds: string[] | undefined;
      useByDefault: boolean | undefined;
      deleted: boolean | undefined;
    }>({
      teamId: undefined,
      search: undefined,
      types: undefined,
      usedByMonitorIds: undefined,
      useByDefault: undefined,
      deleted: undefined,
    }),
    withRequestStatus(),
    withEntities<BackendType['NotificationMethodResponse']>(),
    withPaginatedTable<BackendType['NotificationMethodResponse']>({
      columnsToDisplay: ['name', 'type', 'sender', 'useByDefault', 'actions'],
      defaultSortBy: 'name',
    }),
    withSelection<BackendType['NotificationMethodResponse']>({}),
    withComputed(({search, types, useByDefault}) => ({
      isSearching: computed(
        () =>
          (search() && search()!.length > 0) ||
          (types() && types()!.length > 0) ||
          useByDefault() !== undefined,
      ),
    })),
    withMethods((store, api = injectAPI()) => ({
      setSearch: rxMethod<string | null>(
        pipe(
          map((it) => it ?? ''),
          tap((search) => patchState(store, () => ({search}))),
        ),
      ),
      setTypes: rxMethod<BackendType['NotificationMethodResponse']['data']['_type'][] | null>(
        pipe(
          map((it) => it ?? []),
          tap((types) => patchState(store, () => ({types}))),
        ),
      ),
      setUseByDefault: rxMethod<
        BackendType['NotificationMethodResponse']['useByDefault'] | undefined | null
      >(
        tap((useByDefault) => patchState(store, () => ({useByDefault: useByDefault ?? undefined}))),
      ),
      setUsedByMonitorIds: rxMethod<string[] | undefined>(
        tap((usedByMonitorIds) => patchState(store, () => ({usedByMonitorIds}))),
      ),
      setDeleted: rxMethod<boolean | undefined>(
        tap((deleted) => patchState(store, () => ({deleted}))),
      ),
      load: rxMethod<
        {
          teamId: string | undefined;
          search?: string;
          types?: BackendType['NotificationMethodResponse']['data']['_type'][];
          usedByMonitorIds?: string[];
          useByDefault?: boolean;
          deleted?: boolean;
        } & PaginationDto
      >(
        pipe(
          filter(({teamId}) => !!teamId),
          tap(({teamId}) => patchState(store, setPending(), () => ({teamId}))),
          debounceTime(275),
          switchMap(({teamId, search, ...query}) =>
            api
              .get('/v1/notification-method', {
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
  );
}
