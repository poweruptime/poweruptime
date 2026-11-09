import {inject} from '@angular/core';
import {toObservable} from '@angular/core/rxjs-interop';

import {EMPTY, Subject, filter, map, retry, share, switchMap, tap} from 'rxjs';

import {toast} from '@spartan-ng/brain/sonner';
import {loggerOf} from 'dfts-helper';
import {createInjectable} from 'ngxtension/create-injectable';

import {BackendType, PushDto} from '@app/api';

import {BACKEND_API_URL} from '../util';
import {AuthStore} from './auth';
import {connectToEventSource} from './event-source.service';

export const PushService = createInjectable(() => {
  const logger = loggerOf('PushService');
  const authStore = inject(AuthStore);
  const connected = new Subject<void>();

  const sse$ = toObservable(authStore.accessToken).pipe(
    switchMap((accessToken) =>
      accessToken
        ? connectToEventSource(
            `${BACKEND_API_URL}/v1/sse`,
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
            () => connected.next(),
          ).pipe(retry({delay: 3000}))
        : EMPTY,
    ),
    map((it) => JSON.parse(it.data) as PushDto),
    tap((pushDto) => logger.info('tap', 'New sse event', pushDto)),
    share(),
  );

  return {
    connected$: connected.asObservable(),
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
