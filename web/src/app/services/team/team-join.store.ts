import {inject} from '@angular/core';
import {Router} from '@angular/router';

import {filter, pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withMethods} from '@ngrx/signals';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {toast} from 'ngx-sonner';

import {injectAPI} from '../../api';
import {setError, setFulfilled, setPending, withRequestStatus} from '../store-features';

export const TeamJoinStore = signalStore(
  {providedIn: 'root'},
  withRequestStatus(),
  withMethods((store, api = injectAPI(), router = inject(Router)) => ({
    join: rxMethod<string | undefined>(
      pipe(
        filter((it): it is string => {
          if (!it) {
            toast.error('Please provide a token.');

            void router.navigate(['/']);
            return false;
          }

          return true;
        }),
        tap(() => patchState(store, setPending())),
        switchMap((token) =>
          api.get('/v1/team/join/{token}', {params: {path: {token}}}).pipe(
            tapResponse({
              next: (team) => {
                patchState(store, setFulfilled());

                toast.success(`Successfully joined ${team.name}.`);

                void router.navigate(['/', 't', team.id, 'm']);
              },
              error: (error) => {
                patchState(store, setError(error), setFulfilled());

                toast.error(`Invalid token.`);

                void router.navigate(['/']);
              },
            }),
          ),
        ),
      ),
    ),
  })),
);
