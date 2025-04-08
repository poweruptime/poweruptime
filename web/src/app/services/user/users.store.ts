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
    name: string | undefined;
    email: string | undefined;
    activated: boolean | undefined;
    role: BackendType['UserResponse']['role'] | undefined;
  }>({
    name: undefined,
    email: undefined,
    activated: undefined,
    role: undefined,
  }),
  withRequestStatus(),
  withEntities<BackendType['UserResponse']>(),
  withPaginatedTable<BackendType['UserResponse']>({
    columnsToDisplay: ['email', 'name', 'activated', 'role', 'actions'],
    defaultSortBy: 'createdAt',
    defaultSortDirection: 'desc',
  }),
  withMethods((store, api = injectAPI()) => ({
    setName: rxMethod<string | null>(
      tap((name) => patchState(store, () => ({name: name ?? undefined}))),
    ),
    setEmail: rxMethod<string | null>(
      tap((email) => patchState(store, () => ({email: email ?? undefined}))),
    ),
    setActivated: rxMethod<boolean | null>(
      tap((setActivated) => patchState(store, () => ({activated: setActivated ?? undefined}))),
    ),
    setRole: rxMethod<BackendType['UserResponse']['role'] | null>(
      tap((role) => patchState(store, () => ({role: role ?? undefined}))),
    ),
    load: rxMethod<
      {
        name: string | undefined;
        email: string | undefined;
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
