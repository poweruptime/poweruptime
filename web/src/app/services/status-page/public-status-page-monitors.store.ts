import {computed} from '@angular/core';

import {filter, pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withComputed, withMethods} from '@ngrx/signals';
import {removeAllEntities, setEntities} from '@ngrx/signals/entities';
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

export const PublicStatusPageMonitorsStore = signalStore(
  withPaginatedTable<BackendType['PublicMonitorMinResponse']>({
    columnsToDisplay: [],
    defaultSortBy: 'groupMonitors.position',
    defaultPageSize: 200,
  }),
  withComputed(({entities}) => ({
    status: computed(() => {
      const _entities = entities();
      return _entities.some((it) => it.status === 'DOWN') ? ('DOWN' as const) : ('UP' as const);
    }),
  })),
  withMethods((store, api = injectAPI()) => ({
    load: rxMethod<
      {
        slug?: string;
        usedInStatusPageGroupIds?: string[];
      } & PaginationDto
    >(
      pipe(
        filter((it) => !!it.slug),
        tap(() => patchState(store, setPending())),
        switchMap(({slug, usedInStatusPageGroupIds, ...query}) =>
          api
            .get('/v1/public/status-page/{slug}/monitor', {
              params: {
                path: {
                  slug: slug!!,
                },
                query: {
                  ...query,
                  usedInStatusPageGroupIds,
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
