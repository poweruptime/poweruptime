import {computed, inject} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort, SortDirection} from '@angular/material/sort';
import {ActivatedRoute, Router} from '@angular/router';

import {distinctUntilChanged, map, switchMap, tap} from 'rxjs';

import {
  patchState,
  signalStoreFeature,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import {withEntities} from '@ngrx/signals/entities';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {loggerOf, n_from} from 'dfts-helper';

import {withRequestStatus} from './request-status.feature';

type TableState = {
  columnsToDisplay: string[];
  totalElements: number;
  page: number;
  size: number;
  sortBy: string;
  sortDirection: SortDirection;
};
type withTableOptions = {
  columnsToDisplay: string[];
  defaultSortBy: string;
  defaultSortDirection?: SortDirection;
  defaultPageSize?: number;
  paramPrefix?: string;
};

const lumber = loggerOf('withPaginatedTable');

export type PaginationDto = {
  page: number;
  size: number;
  sort: string[];
};

export function withPaginatedTable<EntityType>({
  columnsToDisplay,
  defaultSortBy,
  defaultSortDirection = 'asc',
  defaultPageSize = 10,
  paramPrefix = '',
}: withTableOptions) {
  return signalStoreFeature(
    withEntities<EntityType>(),
    withRequestStatus(),
    withState<TableState>({
      columnsToDisplay,
      totalElements: 0,
      page: 0,
      size: defaultPageSize,
      sortBy: defaultSortBy,
      sortDirection: defaultSortDirection,
    }),
    withMethods((store, router = inject(Router), activatedRoute = inject(ActivatedRoute)) => ({
      setColumnsToDisplay: rxMethod<string[]>(
        tap((columnsToDisplay) => patchState(store, () => ({columnsToDisplay}))),
      ),
      setPaginator: rxMethod<MatPaginator>(
        switchMap((paginator) =>
          paginator.page.pipe(
            tap(() => {
              const options = {
                page: paginator.pageIndex,
                size: paginator.pageSize,
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
      setSort: rxMethod<MatSort>(
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
      isEmpty: computed(() => store.isFulfilled() && store.entities().length === 0),
      pageable: computed(
        () =>
          ({
            page: store.page(),
            size: store.size(),
            sort: [`${store.sortBy()},${store.sortDirection()}`],
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

export function setTotalElements(totalElements: number): Partial<TableState> {
  return {totalElements};
}
