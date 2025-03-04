import {AbstractControl} from '@angular/forms';

export const minLengthArray = (min: number) => {
  return (c: AbstractControl): {[key: string]: any} | null => {
    if (!c.value) {
      return {minLengthArray: true};
    }
    if (c.value.length >= min) return null;

    return {minLengthArray: true};
  };
};

export const arrayItemMinLength = (minLength: number) => {
  return (c: AbstractControl): {[key: string]: any} | null => {
    if (!c.value) {
      return null;
    }

    for (const it of c.value) {
      if (it.length < minLength) {
        return {
          minLengthArrayItem: {requiredLength: minLength, actualLength: it.length, value: it},
        };
      }
    }

    return null;
  };
};

export const arrayItemMaxLength = (maxLength: number) => {
  return (c: AbstractControl): {[key: string]: any} | null => {
    if (!c.value) {
      return null;
    }
    for (const it of c.value) {
      if (it.length > maxLength) {
        return {
          maxLengthArrayItem: {requiredLength: maxLength, actualLength: it.length, value: it},
        };
      }
    }

    return null;
  };
};

export const arrayItemPattern = (pattern: RegExp) => {
  return (c: AbstractControl): {[key: string]: any} | null => {
    if (!c.value) {
      return null;
    }
    for (const it of c.value) {
      if (!pattern.test(it)) {
        return {patternArrayItem: true};
      }
    }

    return null;
  };
};
