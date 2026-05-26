import {inject} from '@angular/core';

import {debounceTime, filter, pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withHooks, withMethods, withState} from '@ngrx/signals';
import {removeAllEntities, setAllEntities, withEntities} from '@ngrx/signals/entities';
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
  withRequestStatus,
} from '@app/services/store-features';

export const NotificationsStore = signalStore(
  withState<{
    monitorId: string | undefined;
    teamId: string | undefined;
  }>({
    teamId: undefined,
    monitorId: undefined,
  }),
  withRequestStatus(),
  withEntities<BackendType['NotificationResponse']>(),
  withPaginatedTable<BackendType['NotificationResponse']>({
    paramPrefix: 'notifi.',
    columnsToDisplay: ['status', 'title', 'createdAt', 'actions'],
    defaultSortBy: 'createdAt',
    defaultSortDirection: 'desc',
  }),
  withMethods((store, api = injectAPI()) => ({
    addNotification: rxMethod<BackendType['NotificationResponse']>(
      pipe(
        filter((notification) => {
          const monitorId = store.monitorId();
          const teamId = store.teamId();
          if (monitorId) return monitorId === notification.monitor.id;
          if (teamId) return teamId === notification.team.id;
          return true;
        }),
        filter(
          () =>
            store.page() === 0 &&
            store.sortBy() === 'createdAt' &&
            store.sortDirection() === 'desc',
        ),
        tap((notification) =>
          patchState(
            store,
            setAllEntities([
              notification,
              ...store.entities().slice(0, Math.max(store.size() - 1, store.entities().length - 1)),
            ]),
          ),
        ),
      ),
    ),
    load: rxMethod<
      {
        teamId?: string;
        monitorId?: string;
        statuses?: BackendType['MonitorResponse']['status'][];
        start?: string;
        end?: string;
      } & PaginationDto
    >(
      pipe(
        tap(({teamId, monitorId}) =>
          patchState(
            store,
            setPending(),
            store.monitorId() !== monitorId || store.teamId() !== teamId
              ? removeAllEntities()
              : () => ({}),
            () => ({teamId, monitorId}),
          ),
        ),
        debounceTime(275),
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
      store.addNotification(pushService.notifications$);
    },
  }),
);
