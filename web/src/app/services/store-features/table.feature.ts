import {computed} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';

import {tap} from 'rxjs';

import {patchState, signalStoreFeature, withComputed, withMethods, withState} from '@ngrx/signals';
import {withEntities} from '@ngrx/signals/entities';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {IHasID} from 'dfts-helper';

import {withRequestStatus} from './request-status.feature';

type TableState = {
  columnsToDisplay: string[];
  sort: MatSort | undefined;
  paginator: MatPaginator | undefined;
  filter: string | undefined;
};

type SortingDataAccessorsMap<EntityType> = (it: EntityType) => string | number;
type SortingDataAccessors<EntityType> = Record<string, SortingDataAccessorsMap<EntityType>>;

type withTableOptions<EntityType> = {
  columnsToDisplay: string[];
  sortingDataAccessors?: SortingDataAccessors<EntityType>;
};

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

type TableWithSelectionState<EntityType> = {
  selection: EntityType[];
};

type withSelectionTableOptions<EntityType extends IHasID<EntityType['id']>> = {
  find?: (o: EntityType) => EntityType['id'];
} & withTableOptions<EntityType>;

export function withSelectionTable<EntityType extends IHasID<EntityType['id']>>({
  find = (it) => it.id,
  ...options
}: withSelectionTableOptions<EntityType>) {
  return signalStoreFeature(
    withTable<EntityType>({
      ...options,
      columnsToDisplay: ['select', ...options.columnsToDisplay],
    }),
    withState<TableWithSelectionState<EntityType>>({
      selection: [],
    }),
    withComputed((store) => ({
      hasValue: computed(() => store.selection().length > 0),
      isAllSelected: computed(() => {
        const _selection = store.selection();
        if (_selection.length === 0) {
          return false;
        }
        const numSelected = _selection.length;
        const numRows = store.entities().length;
        return numSelected === numRows;
      }),
    })),
    withMethods((store) => ({
      isSelected(o: EntityType): boolean {
        return isEntitySelected(store.selection(), o, find);
      },
      toggleAll(): void {
        if (store.isAllSelected()) {
          patchState(store, () => ({selection: []}));
        } else {
          patchState(store, () => ({selection: store.entities()}));
        }
      },
      toggle(o: EntityType, isSelected = isEntitySelected(store.selection(), o, find)): void {
        if (isSelected) {
          patchState(store, (data) => deselectEntity(data.selection, o, find));
        } else {
          patchState(store, (data) => selectEntity(data.selection, o));
        }
      },
    })),
  );
}

function isEntitySelected<EntityType extends IHasID<EntityType['id']>>(
  selection: EntityType[],
  o: EntityType,
  find: (o: EntityType) => EntityType['id'],
): boolean {
  return selection.findIndex((it) => find(it) === find(o)) !== -1;
}

export function selectEntity<EntityType extends IHasID<EntityType['id']>>(
  selection: EntityType[],
  o: EntityType,
): TableWithSelectionState<EntityType> {
  return {selection: [...selection, o]};
}

export function deselectEntity<EntityType extends IHasID<EntityType['id']>>(
  selection: EntityType[],
  o: EntityType,
  find: (o: EntityType) => EntityType['id'],
): TableWithSelectionState<EntityType> {
  return {selection: [...selection.filter((it) => find(it) !== find(o))]};
}
