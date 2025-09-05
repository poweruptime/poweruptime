import {computed} from '@angular/core';

import {debounceTime, forkJoin, map, pipe, switchMap, tap} from 'rxjs';

import {translate} from '@jsverse/transloco';
import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withComputed, withMethods, withState} from '@ngrx/signals';
import {removeAllEntities, setEntities, withEntities} from '@ngrx/signals/entities';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {toast} from 'ngx-sonner';

import {BackendType, injectAPI} from '@app/api';
import {injectConfirmDialog$} from '@app/components';

import {
  PaginationDto,
  setError,
  setFulfilled,
  setPending,
  setTotalElements,
  withPaginatedTable,
  withRequestStatus,
  withSelection,
} from '../store-features';

export const TeamsStore = signalStore(
  withState<{
    name: string | undefined;
    role: BackendType['TeamMaxResponse']['role'] | undefined;
    deleted: boolean | undefined;
  }>({
    name: undefined,
    role: undefined,
    deleted: undefined,
  }),
  withRequestStatus(),
  withEntities<BackendType['TeamResponse']>(),
  withPaginatedTable<BackendType['TeamResponse']>({
    columnsToDisplay: ['name', 'personalUser.id', 'monitorCount', 'actions'],
    defaultSortBy: 'name',
    defaultSortDirection: 'asc',
  }),
  withSelection<BackendType['TeamResponse']>({}),
  withMethods((store, api = injectAPI(), confirmDialog$ = injectConfirmDialog$()) => {
    const load = rxMethod<
      {
        name?: string;
        role?: BackendType['TeamMaxResponse']['role'];
        deleted?: boolean;
      } & PaginationDto
    >(
      pipe(
        tap(() => patchState(store, setPending())),
        debounceTime(275),
        switchMap((query) =>
          api
            .get('/v1/team', {
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
    );

    return {
      setName: rxMethod<string | null>(
        tap((name) => patchState(store, () => ({name: name ?? undefined}))),
      ),
      setRole: rxMethod<BackendType['TeamMaxResponse']['role'] | undefined>(
        pipe(tap((role) => patchState(store, () => ({role})))),
      ),
      setDeleted: rxMethod<boolean | undefined | null>(
        pipe(tap((deleted) => patchState(store, () => ({deleted: deleted ?? undefined})))),
      ),
      load,
      delete: rxMethod<string>(
        switchMap((id) =>
          confirmDialog$(translate('general.confirmDelete')).pipe(
            tap(() => patchState(store, setPending())),
            switchMap(() =>
              api.delete('/v1/team/{id}', {params: {path: {id}}}).pipe(
                tapResponse({
                  next: () => {
                    load({
                      ...store.pageable(),
                      name: store.name(),
                    });

                    toast.success('Successfully deleted team.', {
                      action: {
                        label: 'Undo',
                        onClick: () =>
                          api
                            .delete('/v1/team/{id}/undo', {params: {path: {id}}})
                            .pipe(
                              tapResponse({
                                next: (team) => {
                                  load({
                                    ...store.pageable(),
                                    name: store.name(),
                                  });

                                  toast.success(`Successfully restored ${team.name}.`);
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
                ids.map((id) => api.delete('/v1/team/{id}/undo', {params: {path: {id}}})),
              ).pipe(
                tapResponse({
                  next: () => {
                    toast.success(translate('general.restoreSuccess'));

                    load({
                      ...store.pageable(),
                      deleted: true,
                      name: store.name(),
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
  withComputed(({entities}) => ({
    personalTeam: computed(() => entities()?.find((team) => team.yourPersonal)),
    sortedEntitiesWithoutYourPersonal: computed(() =>
      entities()
        .filter((it) => !it.yourPersonal)
        .sort((a, b) =>
          a.name.toLowerCase().localeCompare(b.name.toLowerCase(), undefined, {
            numeric: true,
            sensitivity: 'base',
          }),
        ),
    ),
  })),
);
