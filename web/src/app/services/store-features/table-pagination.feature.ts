import {computed, inject} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {ActivatedRoute, Router} from '@angular/router';

import {distinctUntilChanged, map, switchMap, tap} from 'rxjs';

import {HlmPaginator} from '@dafnik/paginator';
import {HlmSort, SortDirection} from '@dafnik/sort';
import {
  patchState,
  signalStoreFeature,
  type,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import {EntityState} from '@ngrx/signals/entities';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {loggerOf, n_from} from 'dfts-helper';

import {RequestStatusState} from './request-status.feature';

type EntityKey<EntityType> = keyof EntityType | 'actions' | string;

interface TableState<EntityType> {
  columnsToDisplay: EntityKey<EntityType>[];
  totalElements: number;
  page: number;
  size: number;
  sortBy: string;
  sortDirection: SortDirection;
}
interface withTableOptions<EntityType> {
  columnsToDisplay: EntityKey<EntityType>[];
  defaultSortBy: string;
  defaultSortDirection?: SortDirection;
  defaultPageSize?: number;
  paramPrefix?: string;
}

const lumber = loggerOf('withPaginatedTable');

export interface PaginationDto {
  page: number;
  size: number;
  sort: string[];
}

export function withPaginatedTable<EntityType>({
  columnsToDisplay,
  defaultSortBy,
  defaultSortDirection = 'asc',
  defaultPageSize = 10,
  paramPrefix = '',
}: withTableOptions<EntityType>) {
  return signalStoreFeature(
    {state: type<EntityState<EntityType> & RequestStatusState>()},
    withState<TableState<EntityType>>({
      columnsToDisplay,
      totalElements: 0,
      page: 0,
      size: defaultPageSize,
      sortBy: defaultSortBy,
      sortDirection: defaultSortDirection,
    }),
    withMethods((store, router = inject(Router), activatedRoute = inject(ActivatedRoute)) => ({
      setColumnsToDisplay: rxMethod<EntityKey<EntityType>[]>(
        tap((columnsToDisplay) => patchState(store, () => ({columnsToDisplay}))),
      ),
      setStartSort: rxMethod<{by: string; direction: SortDirection}>(
        tap(({by, direction}) => patchState(store, () => ({sortBy: by, sortDirection: direction}))),
      ),
      setPageSize: rxMethod<number>(tap((size) => patchState(store, () => ({size})))),
      setHlmPaginator: rxMethod<HlmPaginator>(
        switchMap((paginator) =>
          paginator.page$.pipe(
            tap(() => {
              const options = {
                page: paginator.pageIndex(),
                size: paginator.pageSize(),
              };
              lumber.log('setPaginatorUpdate', 'new params', options);
              patchState(store, () => options);
              void router.navigate([], {
                relativeTo: activatedRoute,
                queryParamsHandling: 'merge',
                queryParams: {
                  [`${paramPrefix}page`]: options.page,
                  [`${paramPrefix}size`]: options.size,
                },
              });
            }),
          ),
        ),
      ),
      setHlmSort: rxMethod<HlmSort>(
        switchMap((sort) =>
          sort.sortChange.pipe(
            tap(() => {
              const options = {
                sortBy: sort.active,
                sortDirection: sort.direction,
              };
              lumber.log('setSortUpdate', 'new params', options);
              void router.navigate([], {
                relativeTo: activatedRoute,
                queryParamsHandling: 'merge',
                queryParams: {
                  [`${paramPrefix}sort`]: options.sortBy,
                  [`${paramPrefix}direction`]: options.sortDirection,
                },
              });
            }),
          ),
        ),
      ),
    })),
    withComputed((store) => ({
      isEmpty: computed(
        () =>
          store.requestStatus() === 'fulfilled' && Object.values(store.entityMap()).length === 0,
      ),
      pageable: computed(
        () =>
          ({
            page: store.page(),
            size: store.size(),
            sort: [`${store.sortBy()}${store.sortDirection() ? `_${store.sortDirection()}` : ''}`],
          }) satisfies PaginationDto,
      ),
    })),
    withHooks({
      onInit(store, activatedRoute = inject(ActivatedRoute)) {
        activatedRoute.queryParamMap
          .pipe(
            takeUntilDestroyed(),
            map((it) => ({
              page: it.get(`${paramPrefix}page`) ? n_from(it.get(`${paramPrefix}page`)) : 0,
              size: it.get(`${paramPrefix}size`)
                ? n_from(it.get(`${paramPrefix}size`))
                : defaultPageSize,
              sortBy: it.get(`${paramPrefix}sort`) ?? defaultSortBy,
              sortDirection:
                (it.get(`${paramPrefix}direction`) as SortDirection) ?? defaultSortDirection,
            })),
            distinctUntilChanged(
              (prev, curr) =>
                prev.page === curr.page &&
                prev.size === curr.size &&
                prev.sortBy === curr.sortBy &&
                prev.sortDirection === curr.sortDirection,
            ),
            tap((it) => patchState(store, () => it)),
          )
          .subscribe();
      },
    }),
  );
}

export function setTotalElements(totalElements: number): Partial<TableState<unknown>> {
  return {totalElements};
}
