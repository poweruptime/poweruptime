import {computed} from '@angular/core';

import {
  patchState,
  signalStoreFeature,
  type,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import {EntityState} from '@ngrx/signals/entities';
import {IHasID} from 'dfts-helper';

type TableWithSelectionState<EntityType> = {
  selection: EntityType[];
};
type withSelectionTableOptions<EntityType extends IHasID<EntityType['id']>> = {
  find?: (o: EntityType) => EntityType['id'];
};

export function withSelection<EntityType extends IHasID<EntityType['id']>>({
  find = (it) => it.id,
}: withSelectionTableOptions<EntityType>) {
  return signalStoreFeature(
    {state: type<EntityState<EntityType>>()},
    withState<TableWithSelectionState<EntityType>>({
      selection: [],
    }),
    withComputed(({selection, entityMap}) => ({
      hasValue: computed(() => selection().length > 0),
      isAllSelected: computed(() => {
        const _selection = selection();
        if (_selection.length === 0) {
          return false;
        }
        const numSelected = _selection.length;
        const numRows = Object.keys(entityMap()).length;
        return numSelected === numRows;
      }),
    })),
    withMethods((store) => ({
      resetSelection() {
        patchState(store, resetSelection());
      },
      isSelected(o: EntityType): boolean {
        return isEntitySelected(store.selection(), o, find);
      },
      toggleAll(): void {
        if (store.isAllSelected()) {
          patchState(store, () => ({selection: []}));
        } else {
          patchState(store, () => ({selection: Object.values(store.entityMap())}));
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

export function resetSelection<
  EntityType extends IHasID<EntityType['id']>,
>(): TableWithSelectionState<EntityType> {
  return {selection: []};
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
