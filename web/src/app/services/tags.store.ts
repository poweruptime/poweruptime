import {debounceTime, filter, pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withMethods} from '@ngrx/signals';
import {setAllEntities, withEntities} from '@ngrx/signals/entities';
import {rxMethod} from '@ngrx/signals/rxjs-interop';

import {BackendType, injectAPI} from '@app/api';
import {setError, setFulfilled, setPending, withRequestStatus} from '@app/services/store-features';

export const TagsStore = signalStore(
  withRequestStatus(),
  withEntities<BackendType['TagDto']>(),
  withMethods((store, api = injectAPI()) => ({
    load: rxMethod<{
      teamId: string | undefined;
      name: string | undefined;
    }>(
      pipe(
        filter(({teamId}) => !!teamId),
        tap(() => patchState(store, setPending())),
        debounceTime(275),
        switchMap(({teamId, name}) =>
          api
            .get('/v1/tag', {
              params: {
                query: {
                  name,
                  teamId: teamId!,
                  page: 0,
                  size: 10,
                  sort: [],
                },
              },
            })
            .pipe(
              tapResponse({
                next: (response) =>
                  patchState(
                    store,
                    setAllEntities(response.data, {selectId: (it) => it.name}),
                    setFulfilled(),
                  ),
                error: (error) => patchState(store, setError(error)),
              }),
            ),
        ),
      ),
    ),
  })),
);
