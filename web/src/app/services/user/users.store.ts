import {debounceTime, pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withMethods, withState} from '@ngrx/signals';
import {removeAllEntities, setEntities, withEntities} from '@ngrx/signals/entities';
import {rxMethod} from '@ngrx/signals/rxjs-interop';

import {BackendType, injectAPI} from '@app/api';

import {
  PaginationDto,
  setError,
  setFulfilled,
  setPending,
  setTotalElements,
  withPaginatedTable,
  withRequestStatus,
} from '../store-features';

export const UsersStore = signalStore(
  withState<{
    search: string | undefined;
    activated: boolean | undefined;
    role: BackendType['UserResponse']['role'] | undefined;
  }>({
    search: undefined,
    activated: undefined,
    role: undefined,
  }),
  withRequestStatus(),
  withEntities<BackendType['UserResponse']>(),
  withPaginatedTable<BackendType['UserResponse']>({
    columnsToDisplay: ['name', 'activated', 'actions'],
    defaultSortBy: 'createdAt',
    defaultSortDirection: 'desc',
  }),
  withMethods((store, api = injectAPI()) => ({
    setSearch: rxMethod<string | null>(
      tap((search) => patchState(store, {search: search ?? undefined})),
    ),
    setActivated: rxMethod<boolean | null>(
      tap((setActivated) => patchState(store, {activated: setActivated ?? undefined})),
    ),
    setRole: rxMethod<BackendType['UserResponse']['role'] | null>(
      tap((role) => patchState(store, {role: role ?? undefined})),
    ),
    load: rxMethod<
      {
        search: string | undefined;
        activated: boolean | undefined;
        role: BackendType['UserResponse']['role'] | undefined;
      } & PaginationDto
    >(
      pipe(
        tap(() => patchState(store, setPending())),
        debounceTime(275),
        switchMap((query) =>
          api
            .get('/v1/user', {
              params: {
                query,
              },
            })
            .pipe(
              tapResponse({
                next: (response) => {
                  patchState(
                    store,
                    removeAllEntities(),
                    setEntities(response.data),
                    setTotalElements(response.numberOfItems),
                    setFulfilled(),
                  );
                },
                error: (error) => patchState(store, setError(error)),
              }),
            ),
        ),
      ),
    ),
  })),
);
