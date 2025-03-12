import {AbstractControl} from '@angular/forms';

export function dateRangeValidator(
  maxRangeInDays: number,
): (control: AbstractControl) => {invalidRange: true} | null {
  return (control: AbstractControl) => {
    const start = control.get('start')?.value as string | null;
    const end = control.get('end')?.value as string | null;

    let invalid = false;
    if (start && end) {
      invalid = new Date(start).valueOf() + 1000 * 3600 * 24 * 30 < new Date(end).valueOf(); //checking if date difference is less than 31 days
    }

    return invalid ? {invalidRange: true} : null;
  };
}
