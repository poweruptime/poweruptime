import {distinctUntilChanged, filter, pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withMethods, withState} from '@ngrx/signals';
import {rxMethod} from '@ngrx/signals/rxjs-interop';

import {BackendType, injectAPI} from '@app/api';
import {setError, setFulfilled, setPending, withRequestStatus} from '@app/services/store-features';

export const NotificationMethodTemplateStore = signalStore(
  withRequestStatus(),
  withState<{
    template: BackendType['NotificationMethodTemplateResponse'] | undefined;
  }>({
    template: undefined,
  }),
  withMethods((store, api = injectAPI()) => ({
    loadByType: rxMethod<
      BackendType['NotificationMethodTemplateResponse']['type'] | undefined | ''
    >(
      pipe(
        filter(
          (it): it is BackendType['NotificationMethodTemplateResponse']['type'] =>
            it !== '' && !!it,
        ),
        distinctUntilChanged(),
        tap(() => patchState(store, setPending(), {template: undefined})),
        switchMap((type) =>
          api.get('/v1/notification-method/template/{type}', {params: {path: {type}}}).pipe(
            tapResponse({
              next: (template) => patchState(store, {template}, setFulfilled()),
              error: (error) => patchState(store, setError(error)),
            }),
          ),
        ),
      ),
    ),
  })),
);
