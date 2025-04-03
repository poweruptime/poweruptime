import {debounceTime, filter, pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withMethods} from '@ngrx/signals';
import {setAllEntities, withEntities} from '@ngrx/signals/entities';
import {rxMethod} from '@ngrx/signals/rxjs-interop';

import {BackendType, injectAPI} from '@app/api';
import {
  PaginationDto,
  setError,
  setFulfilled,
  setPending,
  setTotalElements,
  withPaginatedTable,
  withRequestStatus,
} from '@app/services/store-features';

export const TeamInvitesStore = signalStore(
  withRequestStatus(),
  withEntities<BackendType['TeamJoinTokenResponse']>(),
  withPaginatedTable<BackendType['TeamJoinTokenResponse']>({
    columnsToDisplay: ['inviteeEmail', 'role', 'inviter.name', 'createdAt', 'actions'],
    defaultSortBy: 'createdAt',
  }),
  withMethods((store, api = injectAPI()) => ({
    load: rxMethod<{teamId: string | undefined} & PaginationDto>(
      pipe(
        filter(({teamId}) => !!teamId),
        tap(() => patchState(store, setPending())),
        debounceTime(400),
        switchMap(({teamId, ...query}) =>
          api
            .get('/v1/team/{teamId}/invites', {
              params: {
                path: {
                  teamId: teamId!!,
                },
                query,
              },
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
);
