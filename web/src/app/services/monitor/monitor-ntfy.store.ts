import {Subject, filter, map, share, switchMap, tap} from 'rxjs';

import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {s_imploder} from 'dfts-helper';
import {toast} from 'ngx-sonner';
import {createInjectable} from 'ngxtension/create-injectable';

import {BackendType} from '@app/api';

import {connectToEventSource} from '../event-source.service';

const teamIdImploder = () => s_imploder().separator(',');

export const MonitorNtfyService = createInjectable(() => {
  const teamIds = new Subject<string[]>();

  return {
    setTeamIds: rxMethod<string[]>(tap((it) => teamIds.next(it))),
    checkResults$: teamIds.pipe(
      filter((availableTeamIds) => availableTeamIds.length > 0),
      map((availableTeamIds) => availableTeamIds.map((it) => `pu_t_c_${it}`)),
      switchMap((availableTeamTopicIds) =>
        connectToEventSource(
          `http://localhost:8085/${teamIdImploder().source(availableTeamTopicIds).build()}/sse`,
          {},
          ['message'],
        ),
      ),
      map((it) => {
        const ntfyMessage = JSON.parse(it.data);
        const {checkResult} = JSON.parse(ntfyMessage.message) as {
          checkResult: BackendType['CheckResultResponse'];
        };
        return checkResult;
      }),
      //tap((checkResult) => console.log('[ntfy] New check result', checkResult)),
      share(),
    ),
    monitorStatusChange$: teamIds.pipe(
      filter((availableTeamIds) => availableTeamIds.length > 0),
      map((availableTeamIds) => availableTeamIds.map((it) => `pu_t_m_${it}`)),
      switchMap((availableTeamTopicIds) =>
        connectToEventSource(
          `http://localhost:8085/${teamIdImploder().source(availableTeamTopicIds).build()}/sse`,
          {},
          ['message'],
        ),
      ),
      map((it) => {
        const ntfyMessage = JSON.parse(it.data);
        const {monitor} = JSON.parse(ntfyMessage.message) as {
          monitor: BackendType['MonitorFullResponse'];
        };
        return monitor;
      }),
      tap((monitor) => {
        console.log('[ntfy] Monitor status change', monitor);

        if (monitor.status === 'UP') {
          toast.success(`${monitor.name} went up`);
        }
        if (monitor.status === 'DOWN') {
          toast.error(`${monitor.name} went down`);
        }
      }),
      share(),
    ),
  };
});
