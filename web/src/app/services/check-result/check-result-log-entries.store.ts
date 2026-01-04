import {computed} from '@angular/core';

import {distinctUntilChanged, filter, pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withComputed, withMethods} from '@ngrx/signals';
import {removeAllEntities, setAllEntities, withEntities} from '@ngrx/signals/entities';
import {rxMethod} from '@ngrx/signals/rxjs-interop';

import {BackendType, injectAPI} from '@app/api';
import {setError, setFulfilled, setPending, withRequestStatus} from '@app/services/store-features';

export const CheckResultLogEntriesStore = signalStore(
  {providedIn: 'root'},
  withRequestStatus(),
  withEntities<BackendType['CheckResultLogEntryResponse']>(),
  withComputed((store) => ({
    mappedEntities: computed(() => store.entities().map(mapEntriesWithTime)),
  })),
  withComputed((store) => ({
    setup: computed(() => store.mappedEntities().filter((it) => it.stage === 'SETUP')),
    check: computed(() => store.mappedEntities().filter((it) => it.stage === 'CHECK')),
    statusUpdate: computed(() =>
      store.mappedEntities().filter((it) => it.stage === 'MONITOR_STATUS_UPDATE'),
    ),
    notifications: computed(() =>
      store
        .mappedEntities()
        .filter(
          (it) => it.stage === 'NOTIFICATION' && it.properties?.['subNotificationId'] === undefined,
        ),
    ),
    notificationsGrouped: computed(() => {
      // First, reduce to group by notificationId, but DO NOT map yet
      const groupedByNotificationId = store
        .entities()
        .filter((it) => it.stage === 'NOTIFICATION')
        .reduce(
          (acc, entity) => {
            const subNotificationId = entity.properties?.['subNotificationId'];

            if (!subNotificationId) {
              return acc;
            }

            if (!acc[subNotificationId]) {
              acc[subNotificationId] = [];
            }

            acc[subNotificationId].push(entity);
            return acc;
          },
          {} as Record<string, BackendType['CheckResultLogEntryResponse'][]>,
        );

      Object.keys(groupedByNotificationId).forEach((key) => {
        groupedByNotificationId[key] = groupedByNotificationId[key].map(mapEntriesWithTime);
      });

      return groupedByNotificationId;
    }),
  })),
  withMethods((store, api = injectAPI()) => ({
    load: rxMethod<string | undefined>(
      pipe(
        filter((it): it is string => !!it),
        distinctUntilChanged(),
        tap(() => patchState(store, setPending(), removeAllEntities())),
        switchMap((checkResultId) =>
          api
            .get('/v1/check-result/{checkResultId}/log', {
              params: {
                path: {
                  checkResultId,
                },
              },
            })
            .pipe(
              tapResponse({
                next: (entities) => patchState(store, setAllEntities(entities), setFulfilled()),
                error: (error) => patchState(store, setError(error)),
              }),
            ),
        ),
      ),
    ),
  })),
);

const mapEntriesWithTime = (
  it: BackendType['CheckResultLogEntryResponse'],
  index: number,
  entries: BackendType['CheckResultLogEntryResponse'][],
) => ({
  ...it,
  properties: {
    ...it.properties,
    time:
      it.properties?.['time'] ??
      (entries[index - 1]
        ? (
            new Date(it.createdAt).getTime() - new Date(entries[index - 1]?.createdAt).getTime()
          ).toString()
        : undefined),
  } as Record<string, string>,
});
