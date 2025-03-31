import {forkJoin, map, switchMap, tap} from 'rxjs';

import {translate} from '@jsverse/transloco';
import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withMethods} from '@ngrx/signals';
import {removeEntity} from '@ngrx/signals/entities';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {toast} from 'ngx-sonner';

import {injectAPI} from '@app/api';
import {injectConfirmDialog$} from '@app/components';
import {setError, setFulfilled, setPending} from '@app/services/store-features';

import {withNotificationMethodsLoad} from './notification-methods.feature';

export const NotificationMethodsStore = signalStore(
  withNotificationMethodsLoad(),
  withMethods((store, api = injectAPI(), confirmDialog$ = injectConfirmDialog$()) => ({
    restoreSelection: rxMethod<void>(
      switchMap(() =>
        confirmDialog$(
          translate('general.confirmRestore.title'),
          translate('general.confirmRestore.description'),
        ).pipe(
          tap(() => patchState(store, setPending())),
          map(() => store.selection().map((it) => it.id)),
          switchMap((ids) =>
            forkJoin(
              ids.map((id) =>
                api.delete('/v1/notification-method/{id}/undo', {params: {path: {id}}}),
              ),
            ).pipe(
              tapResponse({
                next: () => {
                  toast.success(translate('general.restoreSuccess'));

                  store.load({
                    ...store.pageable(),
                    deleted: store.deleted(),
                    teamId: store.teamId(),
                  });
                },
                error: (error) => patchState(store, setError(error)),
              }),
            ),
          ),
        ),
      ),
    ),
    delete: rxMethod<string>(
      switchMap((id) =>
        confirmDialog$(translate('general.confirmDelete')).pipe(
          tap(() => patchState(store, setPending())),
          switchMap(() =>
            api.delete('/v1/notification-method/{id}', {params: {path: {id}}}).pipe(
              tapResponse({
                next: () => {
                  patchState(store, setFulfilled(), removeEntity(id));

                  toast.success('Successfully deleted notification method.', {
                    action: {
                      label: 'Undo',
                      onClick: () =>
                        api
                          .delete('/v1/notification-method/{id}/undo', {params: {path: {id}}})
                          .pipe(
                            tapResponse({
                              next: (notificationMethod) => {
                                store.load({
                                  ...store.pageable(),
                                  teamId: store.teamId(),
                                  search: store.search(),
                                  types: store.types(),
                                  useByDefault: store.useByDefault(),
                                });

                                toast.success(`Successfully restored ${notificationMethod.name}.`);
                              },
                              error: (error) => patchState(store, setError(error)),
                            }),
                          )
                          .subscribe(),
                    },
                  });
                },
                error: (error) => patchState(store, setError(error)),
              }),
            ),
          ),
        ),
      ),
    ),
  })),
);

export const SelectedNotificationMethodsForMonitorStore = signalStore(
  withNotificationMethodsLoad(),
);

export const DefaultSelectedNotificationMethodsStore = signalStore(withNotificationMethodsLoad());
