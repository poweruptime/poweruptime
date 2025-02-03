import {Signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {FormGroup} from '@angular/forms';

import {distinctUntilChanged, map, tap} from 'rxjs';

export function injectIsValid(form: FormGroup): Signal<boolean> {
  return toSignal(
    form.statusChanges.pipe(
      map(() => form.valid),
      distinctUntilChanged(),
      tap(() => {
        console.log(`formValidChange is valid = ${form.valid}`, form.getRawValue());
      }),
    ),
    {initialValue: form.valid},
  );
}
