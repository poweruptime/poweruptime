import {computed} from '@angular/core';

import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';

import {tap} from 'rxjs';

import {patchState, signalStoreFeature, withComputed, withMethods, withState} from '@ngrx/signals';
import {withEntities} from '@ngrx/signals/entities';
import {rxMethod} from '@ngrx/signals/rxjs-interop';

import {withRequestStatus} from './request-status.feature';

interface TableState {
  columnsToDisplay: string[];
  sort: MatSort | undefined;
  paginator: MatPaginator | undefined;
  filter: string | undefined;
}

type SortingDataAccessorsMap<EntityType> = (it: EntityType) => string | number;
type SortingDataAccessors<EntityType> = Record<string, SortingDataAccessorsMap<EntityType>>;

interface withTableOptions<EntityType> {
  columnsToDisplay: string[];
  sortingDataAccessors?: SortingDataAccessors<EntityType>;
}

export function withTable<EntityType>({
  columnsToDisplay,
  sortingDataAccessors,
}: withTableOptions<EntityType>) {
  return signalStoreFeature(
    withEntities<EntityType>(),
    withRequestStatus(),
    withState<TableState>({
      columnsToDisplay,
      sort: undefined,
      paginator: undefined,
      filter: undefined,
    }),
    withMethods((store) => ({
      setColumnsToDisplay: rxMethod<string[]>(
        tap((columnsToDisplay) => patchState(store, () => ({columnsToDisplay}))),
      ),
      setFilter: rxMethod<string | undefined>(tap((filter) => patchState(store, () => ({filter})))),
      setPaginator: rxMethod<MatPaginator | undefined>(
        tap((paginator) => patchState(store, () => ({paginator}))),
      ),
      setSort: rxMethod<MatSort | undefined>(tap((sort) => patchState(store, () => ({sort})))),
    })),
    withComputed((store) => ({
      dataSource: computed(() => {
        const _dataSource = new MatTableDataSource<EntityType>(store.entities());

        if (sortingDataAccessors) {
          _dataSource.sortingDataAccessor = (item, property) => {
            const fun = sortingDataAccessors[property] as
              | SortingDataAccessorsMap<EntityType>
              | undefined;
            if (!fun) {
              return item[property as keyof EntityType] as string | number;
            }
            return fun(item);
          };
        }
        const _sort = store.sort();
        if (_sort) {
          _dataSource.sort = _sort;
        }
        const _paginator = store.paginator();
        if (_paginator) {
          _dataSource.paginator = _paginator;
        }

        const _filter = store.filter();
        if (_filter) {
          _dataSource.filter = _filter;
        }

        return _dataSource;
      }),
      isEmpty: computed(() => store.isFulfilled() && store.entities().length === 0),
    })),
  );
}
