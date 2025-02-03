import {DestroyRef, Signal, computed, effect, inject, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort, SortDirection} from '@angular/material/sort';
import {ActivatedRoute, Router} from '@angular/router';

import {Subscription, distinctUntilChanged, map, merge, of} from 'rxjs';

import {loggerOf, n_from} from 'dfts-helper';

export interface PageableDto {
  page: number;
  size: number;
  sort: string[];
}

const DEFAULT_SORT_DIRECTION = 'desc';
const DEFAULT_PAGE_SIZE = 20;

const lumber = loggerOf('pagination');

export function injectPagination({
  defaultSortBy,
  defaultSortDirection,
  defaultPageSize,
  paramPrefix = '',
  paginator,
  sort,
}: {
  defaultSortBy: string;
  defaultSortDirection?: SortDirection;
  defaultPageSize?: number;
  paramPrefix?: string;
  paginator: Signal<MatPaginator>;
  sort?: Signal<MatSort>;
}) {
  const activatedRoute = inject(ActivatedRoute);
  const router = inject(Router);

  let subscription: Subscription | undefined;
  inject(DestroyRef).onDestroy(() => {
    subscription?.unsubscribe();
  });

  effect(() => {
    const _paginator = paginator();
    const _sort = sort ? sort() : undefined;

    subscription?.unsubscribe();

    subscription = merge(
      _paginator.page as any,
      _sort?.sortChange ?? (of(undefined) as any),
    ).subscribe({
      next: () => {
        const queryParams = {
          [`${paramPrefix}size`]: _paginator.pageSize,
          [`${paramPrefix}page`]: _paginator.pageIndex,
          [`${paramPrefix}sort`]: _sort?.active,
          [`${paramPrefix}direction`]: _sort?.direction,
        };
        lumber.log('updatePaginationParams', 'new params', queryParams);
        void router.navigate([], {
          relativeTo: activatedRoute,
          queryParamsHandling: 'merge',
          queryParams,
        });
      },
    });
  });

  const loading = signal(true);
  const totalElements = signal<number>(0);

  const params: Signal<PageableDto> = toSignal(
    activatedRoute.queryParamMap.pipe(
      map((it) => {
        const sortName = it.get(`${paramPrefix}sort`) ?? defaultSortBy;
        const sortDirection =
          (it.get(`${paramPrefix}direction`) as SortDirection | undefined) ??
          defaultSortDirection ??
          DEFAULT_SORT_DIRECTION;
        return {
          page: it.get(`${paramPrefix}page`) ? n_from(it.get(`${paramPrefix}page`)) : 0,
          size: it.get(`${paramPrefix}size`)
            ? n_from(it.get(`${paramPrefix}size`))
            : (defaultPageSize ?? DEFAULT_PAGE_SIZE),
          sort: [`${sortName},${sortDirection}`],
        };
      }),
      distinctUntilChanged(
        (prev, curr) =>
          prev.page === curr.page && prev.size === curr.size && prev.sort[0] === curr.sort[0],
      ),
    ),
    {
      initialValue: {
        page: 0,
        size: defaultPageSize ?? DEFAULT_PAGE_SIZE,
        sort: [`${defaultSortBy},${defaultSortDirection ?? DEFAULT_SORT_DIRECTION}`],
      },
    },
  );

  const sortParams = computed(() => {
    const _params = params().sort[0].split(',');

    return {
      name: _params[0],
      direction: _params[1] as SortDirection,
    };
  });

  return {
    params,
    sortParams,
    loading,
    totalElements,
  };
}
