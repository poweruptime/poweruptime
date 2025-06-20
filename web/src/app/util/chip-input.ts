import {FormControl} from '@angular/forms';

import {MatChipInputEvent} from '@angular/material/chips';

export function chipInputRemove(
  control: FormControl<string[] | null | undefined>,
  keyword: string,
) {
  const values = control.value;

  if (!values) {
    return;
  }

  const index = values.indexOf(keyword);
  if (index < 0) {
    return;
  }

  values.splice(index, 1);
  control.setValue([...values]);
}

export function chipInputAdd(
  control: FormControl<string[] | null | undefined>,
  event: MatChipInputEvent,
): void {
  const value = (event.value || '').trim();

  // Add our keyword
  if (value) {
    control.setValue([...(control.value ?? []), value]);
  }

  // Clear the input value
  event.chipInput!.clear();
}
