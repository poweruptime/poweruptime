import {FormControl} from '@angular/forms';

export function chipInputAdd(
  listControl: FormControl<string[] | null>,
  inputControl: FormControl<string>,
) {
  listControl.setValue([...(listControl.getRawValue() ?? []), inputControl.getRawValue()]);
  inputControl.reset();
}

export function chipInputRemove(listControl: FormControl<string[] | null>, toRemove: string) {
  const list = listControl.getRawValue() ?? [];
  const index = list.findIndex((it) => it === toRemove);

  if (index < 0) {
    return;
  }

  list.splice(index, 1);

  listControl.setValue([...list]);
}
