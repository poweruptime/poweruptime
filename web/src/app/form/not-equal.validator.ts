import {AbstractControl, ValidatorFn} from '@angular/forms';

export const notEqual = (val: any): ValidatorFn => {
  return (control: AbstractControl): {[key: string]: boolean} => {
    let v: any = control.value;

    return val !== v ? {} : {notEqual: true};
  };
};
