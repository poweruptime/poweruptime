import {computed} from '@angular/core';

import {debounceTime, filter, forkJoin, map, pipe, switchMap, tap} from 'rxjs';

import {translate} from '@jsverse/transloco';
import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withComputed, withMethods, withState} from '@ngrx/signals';
import {removeAllEntities, removeEntity, setEntities} from '@ngrx/signals/entities';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {toast} from 'ngx-sonner';

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
  withSelection,
} from '@app/services/store-features';

export const NotificationMethodsStore = signalStore(
  withState<{
    teamId: string | undefined;
    search: string;
    types: BackendType['NotificationMethodResponse']['sender']['_type'][];
    useByDefault: boolean | undefined;
    deleted: boolean | undefined;
  }>({
    teamId: undefined,
    search: '',
    types: [],
    useByDefault: undefined,
    deleted: undefined,
  }),
  withPaginatedTable<BackendType['NotificationMethodResponse']>({
    columnsToDisplay: ['name', 'sender._type', 'sender', 'useByDefault', 'actions'],
    defaultSortBy: 'name',
  }),
  withSelection<BackendType['NotificationMethodResponse']>({}),
  withComputed(({search, types, useByDefault}) => ({
    isSearching: computed(() => search().length > 0 || types().length > 0 || useByDefault !== null),
  })),
  withMethods((store, api = injectAPI(), confirmDialog$ = injectConfirmDialog$()) => {
    const load = rxMethod<
      {
        teamId: string | undefined;
        search?: string;
        types?: BackendType['NotificationMethodResponse']['sender']['_type'][];
        useByDefault?: boolean;
        deleted?: boolean;
      } & PaginationDto
    >(
      pipe(
        filter(({teamId}) => !!teamId),
        tap(({teamId}) => patchState(store, setPending(), () => ({teamId}))),
        debounceTime(400),
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
                    removeAllEntities(),
                    resetSelection(),
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
      setUseByDefault: rxMethod<
        BackendType['NotificationMethodResponse']['useByDefault'] | undefined
      >(tap((useByDefault) => patchState(store, () => ({useByDefault})))),
      setDeleted: rxMethod<boolean | undefined>(
        tap((deleted) => patchState(store, () => ({deleted}))),
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
                ids.map((id) =>
                  api.delete('/v1/notification-method/{id}/undo', {params: {path: {id}}}),
                ),
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

                                  toast.success(
                                    `Successfully restored ${notificationMethod.name}.`,
                                  );
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
      load,
    };
  }),
);
