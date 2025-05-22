import {AbstractControl, ValidatorFn} from '@angular/forms';

export const notEqual = (val: unknown): ValidatorFn => {
  return (control: AbstractControl): {[key: string]: boolean} => {
    const v: unknown = control.value;

    return val !== v ? {} : {notEqual: true};
  };
};
