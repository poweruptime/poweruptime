import {inject} from '@angular/core';
import {Router} from '@angular/router';

import {filter, pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withMethods} from '@ngrx/signals';
import {removeEntity, setAllEntities, withEntities} from '@ngrx/signals/entities';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {toast} from 'ngx-sonner';

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

export const TeamUsersStore = signalStore(
  withRequestStatus(),
  withEntities<BackendType['TeamUserResponse']>(),
  withPaginatedTable<BackendType['TeamUserResponse']>({
    columnsToDisplay: ['id.user.name', 'role', 'invitedBy.name', 'createdAt', 'actions'],
    defaultSortBy: 'id.user.name',
  }),
  withMethods((store, api = injectAPI(), router = inject(Router)) => ({
    load: rxMethod<{teamId: string | undefined} & PaginationDto>(
      pipe(
        filter(({teamId}) => !!teamId),
        tap(() => patchState(store, setPending())),
        switchMap(({teamId, ...query}) =>
          api
            .get('/v1/team/{teamId}/user', {
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
                      selectId: (it) => it.user.id,
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
    invite: rxMethod<{
      teamId: string;
      role: BackendType['InviteTeamUserDto']['role'];
      email: string;
    }>(
      pipe(
        tap(() => patchState(store, setPending())),
        switchMap(({teamId, ...body}) =>
          api
            .post('/v1/team/{teamId}/user', {
              params: {
                path: {
                  teamId,
                },
              },
              body,
            })
            .pipe(
              tapResponse({
                next: () => {
                  patchState(store, setFulfilled());

                  toast.success(`Successfully invited ${body.email}.`);

                  void router.navigateByUrl(`/t/${teamId}/edit`);
                },
                error: (error: any) => {
                  patchState(store, setError(error), setFulfilled());

                  console.log(error?.error);

                  if (error?.error?.httpCode === 404) {
                    toast.error(`${body.email} not found`);

                    return;
                  }

                  if (error?.error?.httpCode === 429) {
                    toast.error(`Invite rate limit exceeded for ${body.email}`);

                    return;
                  }

                  if (error?.error?.codeName === 'PERSONAL_TEAM') {
                    toast.error(`You can't invite other users to your personal team`);

                    return;
                  }

                  if (error?.error?.codeName === 'ALREADY_IN_TEAM') {
                    toast.error(`${body.email} is already in the team`);

                    return;
                  }

                  toast.error(`Inviting ${body.email} went wrong`);
                },
              }),
            ),
        ),
      ),
    ),
    remove: rxMethod<{
      teamId: string;
      userId: string;
    }>(
      pipe(
        tap(() => patchState(store, setPending())),
        switchMap((path) =>
          api
            .delete('/v1/team/{teamId}/user/{userId}', {
              params: {
                path,
              },
            })
            .pipe(
              tapResponse({
                next: () => {
                  patchState(store, setFulfilled(), removeEntity(path.userId));

                  toast.success(`Successfully removed user`);
                },
                error: (error) => {
                  patchState(store, setError(error), setFulfilled());

                  toast.error(`Could not remove user`);
                },
              }),
            ),
        ),
      ),
    ),
  })),
);
