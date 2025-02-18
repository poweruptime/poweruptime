import {Subject, filter, map, share, switchMap, tap} from 'rxjs';

import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {s_imploder} from 'dfts-helper';
import {toast} from 'ngx-sonner';
import {createInjectable} from 'ngxtension/create-injectable';

import {BackendType, PushDto} from '@app/api';

import {environment} from '../../environments/environment';
import {connectToEventSource} from './event-source.service';

const teamIdImploder = () => s_imploder().separator(',');

export const PushService = createInjectable(() => {
  const teamIds = new Subject<string[]>();

  const sse$ = teamIds.pipe(
    filter((availableTeamIds) => availableTeamIds.length > 0),
    switchMap((availableTeamTopicIds) =>
      connectToEventSource(
        `${environment.apiUrl}/v1/public/sse/${teamIdImploder().source(availableTeamTopicIds).build()}`,
        {},
        ['message'],
      ),
    ),
    map((it) => JSON.parse(it.data) as PushDto),
    tap((pushDto) => console.log('[push] New sse event', pushDto)),
    share(),
  );

  return {
    setTeamIds: rxMethod<string[]>(tap((it) => teamIds.next(it))),
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
