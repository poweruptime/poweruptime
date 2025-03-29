import {debounceTime, pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withMethods, withState} from '@ngrx/signals';
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
} from '../store-features';

export const TeamsStore = signalStore(
  withState<{
    name: string | undefined;
  }>({
    name: undefined,
  }),
  withPaginatedTable<BackendType['TeamResponse']>({
    columnsToDisplay: ['name', 'personalUser.id', 'monitorCount', 'actions'],
    defaultSortBy: 'name',
    defaultSortDirection: 'asc',
  }),
  withMethods((store, api = injectAPI()) => {
    const load = rxMethod<
      {
        name: string | undefined;
      } & PaginationDto
    >(
      pipe(
        tap(() => patchState(store, setPending())),
        debounceTime(400),
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
      load,
      delete: rxMethod<string>(
        pipe(
          tap(() => patchState(store, setPending())),
          switchMap((id) =>
            api.delete('/v1/team/{id}', {params: {path: {id}}}).pipe(
              tapResponse({
                next: () => {
                  patchState(store, setFulfilled(), removeEntity(id));

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
    };
  }),
);
