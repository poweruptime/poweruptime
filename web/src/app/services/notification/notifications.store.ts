import {inject} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import {debounceTime, pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withHooks, withMethods, withState} from '@ngrx/signals';
import {removeAllEntities, setAllEntities} from '@ngrx/signals/entities';
import {rxMethod} from '@ngrx/signals/rxjs-interop';

import {BackendType, injectAPI} from '@app/api';
import {PushService} from '@app/services';
import {
  PaginationDto,
  setError,
  setFulfilled,
  setPending,
  setTotalElements,
  withPaginatedTable,
} from '@app/services/store-features';

export const NotificationsStore = signalStore(
  withState<{
    monitorId: string | undefined;
  }>({
    monitorId: undefined,
  }),
  withPaginatedTable<BackendType['NotificationResponse']>({
    paramPrefix: 'noti_',
    columnsToDisplay: ['status', 'createdAt', 'method', 'title'],
    defaultSortBy: 'createdAt',
    defaultSortDirection: 'desc',
  }),
  withMethods((store, api = injectAPI()) => ({
    addNotification(notification: BackendType['NotificationResponse']): void {
      if (!store.monitorId() || store.monitorId() === notification.monitor.id) {
        if (store.page() === 0 && store.sortBy() === 'createdAt') {
          patchState(
            store,
            setAllEntities([
              notification,
              ...store.entities().slice(0, Math.max(store.size() - 1, store.entities().length - 1)),
            ]),
          );
        }
      }
    },
    load: rxMethod<
      {
        teamId: string | undefined;
        monitorId: string | undefined;
      } & PaginationDto
    >(
      pipe(
        tap(({monitorId}) =>
          patchState(
            store,
            setPending(),
            store.monitorId() !== monitorId ? removeAllEntities() : () => ({}),
            () => ({monitorId}),
          ),
        ),
        debounceTime(400),
        switchMap((query) =>
          api
            .get('/v1/notification', {
              params: {query},
            })
            .pipe(
              tapResponse({
                next: (response) =>
                  patchState(
                    store,
                    setAllEntities(response.data),
                    setTotalElements(response.numberOfItems),
                    setFulfilled(),
                  ),
                error: (error) => patchState(store, setError(error)),
              }),
            ),
        ),
      ),
    ),
  })),
  withHooks({
    onInit(store, pushService = inject(PushService)) {
      pushService.notifications$
        .pipe(takeUntilDestroyed())
        .subscribe((it) => store.addNotification(it));
    },
  }),
);
