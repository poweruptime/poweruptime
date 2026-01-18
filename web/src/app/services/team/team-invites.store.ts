import {debounceTime, filter, pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withMethods, withState} from '@ngrx/signals';
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
  {providedIn: 'root'},
  withRequestStatus(),
  withEntities<BackendType['TeamJoinTokenResponse']>(),
  withPaginatedTable<BackendType['TeamJoinTokenResponse']>({
    columnsToDisplay: ['inviteeEmail', 'role', 'inviter.name', 'createdAt'],
    defaultSortBy: 'createdAt',
  }),
  withState<{teamId: string | undefined}>({teamId: undefined}),
  withMethods((store, api = injectAPI()) => ({
    load: rxMethod<{teamId: string | undefined} & PaginationDto>(
      pipe(
        filter(({teamId}) => !!teamId),
        tap(({teamId}) => patchState(store, setPending(), () => ({teamId}))),
        debounceTime(275),
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
                    setAllEntities(response.data, {
                      selectId: (it) =>
                        `${it.inviter.id}-${it.inviteeEmail}-${new Date(it.createdAt).getTime().toString()}`,
                    }),
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
