import {inject} from '@angular/core';
import {toObservable} from '@angular/core/rxjs-interop';

import {filter, map, share, switchMap, tap} from 'rxjs';

import {toast} from 'ngx-sonner';
import {createInjectable} from 'ngxtension/create-injectable';

import {BackendType, PushDto} from '@app/api';
import {AuthStore} from '@app/services/auth.store';

import {environment} from '../../environments/environment';
import {connectToEventSource} from './event-source.service';

export const PushService = createInjectable(() => {
  const authStore = inject(AuthStore);

  const sse$ = toObservable(authStore.accessToken).pipe(
    filter((it): it is string => !!it),
    switchMap((accessToken) =>
      connectToEventSource(
        `${environment.apiUrl}/v1/sse`,
        {
          fetch: (input, init) =>
            fetch(input, {
              ...init,
              headers: {
                ...init?.headers,
                Authorization: `Bearer ${accessToken}`,
              },
            }),
        },
        ['message'],
      ),
    ),
    map((it) => JSON.parse(it.data) as PushDto),
    tap((pushDto) => console.log('[push] New sse event', pushDto)),
    share(),
  );

  return {
    checkResults$: sse$.pipe(
      filter((it) => it.type === 'CHECK_RESULT'),
      map((it) => (it as any).checkResult as BackendType['CheckResultResponse']),
      share(),
    ),
    monitorStatusChange$: sse$.pipe(
      filter((it) => it.type === 'MONITOR'),
      map((it) => (it as any).monitor as BackendType['MonitorFullResponse']),
      tap((monitor) => {
        if (monitor.status === 'UP') {
          toast.success(`${monitor.name} went up`);
        }
        if (monitor.status === 'DOWN') {
          toast.error(`${monitor.name} went down`);
        }
      }),
      share(),
    ),
    notifications$: sse$.pipe(
      filter((it) => it.type === 'NOTIFICATION'),
      map((it) => (it as any).notification as BackendType['NotificationResponse']),
      share(),
    ),
  };
});
