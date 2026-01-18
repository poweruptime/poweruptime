import {Signal, computed} from '@angular/core';

export function injectDateRangeValidator(
  maxRangeInDays: number,
  start: Signal<string>,
  end: Signal<string>,
) {
  return computed(() => {
    let invalid = false;
    if (start && end) {
      invalid =
        new Date(start()).valueOf() + 1000 * 3600 * 24 * maxRangeInDays < new Date(end()).valueOf(); //checking if date difference is less than 31 days
    }

    return invalid;
  });
}
