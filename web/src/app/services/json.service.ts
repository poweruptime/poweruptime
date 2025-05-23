import {toSignal} from '@angular/core/rxjs-interop';

import {shareReplay, tap} from 'rxjs';

import {createInjectable} from 'ngxtension/create-injectable';

import {injectAPI} from '../api';

export const JsonService = createInjectable(() => {
  const api = injectAPI();

  const json$ = api.get('/v1/public/json').pipe(
    tap((response) => console.log('Instance information', response)),
    shareReplay(1),
  );

  return {
    json$,
    json: toSignal(json$),
  };
});
