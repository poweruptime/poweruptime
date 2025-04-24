import {pipe, switchMap, tap} from 'rxjs';

import {translate} from '@jsverse/transloco';
import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withMethods} from '@ngrx/signals';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {toast} from 'ngx-sonner';

import {BackendType, injectAPI} from '../../api';
import {setError, setFulfilled, setPending, withRequestStatus} from '../store-features';

export const SetupStore = signalStore(
  {providedIn: 'root'},
  withRequestStatus(),
  withMethods((store, api = injectAPI()) => ({
    setup: rxMethod<BackendType['SetupDto']>(
      pipe(
        tap(() => patchState(store, setPending())),
        switchMap((body) =>
          api.post('/v1/auth/setup', {body}).pipe(
            tapResponse({
              next: () => {
                patchState(store, setFulfilled());
                toast.success(
                  translate(
                    'Successfully setup your first admin account. Please check your E-Mail inbox.',
                  ),
                );
              },
              error: (error) => patchState(store, setError(error)),
            }),
          ),
        ),
      ),
    ),
  })),
);
