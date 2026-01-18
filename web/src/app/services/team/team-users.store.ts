import {inject} from '@angular/core';
import {FormArray} from '@angular/forms';

import {filter, forkJoin, map, pipe, switchMap, tap} from 'rxjs';

import {translate} from '@jsverse/transloco';
import {mapResponse, tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withMethods} from '@ngrx/signals';
import {removeEntities, setAllEntities, withEntities} from '@ngrx/signals/entities';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {BrnDialogRef} from '@spartan-ng/brain/dialog';
import {toast} from 'ngx-sonner';

import {BackendType, injectAPI} from '@app/api';
import {injectConfirmDeleteDialog$} from '@app/components';
import {
  PaginationDto,
  resetSelection,
  setError,
  setFulfilled,
  setPending,
  setTotalElements,
  withPaginatedTable,
  withRequestStatus,
  withSelection,
} from '@app/services/store-features';

import {TeamInvitesStore} from './team-invites.store';

export const TeamUsersStore = signalStore(
  {providedIn: 'root'},
  withRequestStatus(),
  withEntities<BackendType['TeamUserResponse']>(),
  withPaginatedTable<BackendType['TeamUserResponse']>({
    columnsToDisplay: ['select', 'id.user.name', 'invitedBy.name', 'createdAt'],
    defaultSortBy: 'id.user.name',
  }),
  withSelection<BackendType['TeamUserResponse']>({find: (it) => it.user.id}),
  withMethods(
    (
      store,
      api = injectAPI(),
      confirmDialog$ = injectConfirmDeleteDialog$(),
      teamInvitesStore = inject(TeamInvitesStore),
    ) => ({
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
        dialogRef: BrnDialogRef;
        membersForm: FormArray;
        teamId: string;
        members: {
          role: BackendType['InviteTeamUserDto']['role'];
          email: string;
        }[];
      }>(
        pipe(
          tap(() => patchState(store, setPending())),
          switchMap(({teamId, members, dialogRef, membersForm}) =>
            forkJoin(
              members.map((member, index) =>
                api
                  .post('/v1/team/{teamId}/user', {
                    params: {
                      path: {
                        teamId,
                      },
                    },
                    body: {
                      role: member.role,
                      email: member.email,
                    },
                  })
                  .pipe(
                    mapResponse({
                      next: () => {
                        toast.success(`Successfully invited ${member.email}.`);
                        return true;
                      },
                      error: (error: any) => {
                        console.log(error?.error);

                        if (error?.error?.codeName === 'NOT_FOUND') {
                          membersForm.controls[index]!.setErrors({mailNotFound: true});
                          toast.error(`${member.email} not found`);
                        } else if (error?.error?.code === 429) {
                          membersForm.controls[index]!.setErrors({rateLimitExeceeded: true});
                          toast.error(`Invite rate limit exceeded for ${member.email}`);
                        } else if (error?.error?.codeName === 'PERSONAL_TEAM') {
                          membersForm.controls[index]!.setErrors({personalTeam: true});
                          toast.error(`You can't invite other users to your personal team`);
                        } else if (error?.error?.codeName === 'ALREADY_IN_TEAM') {
                          membersForm.controls[index]!.setErrors({alreadyInTeam: true});
                          toast.error(`${member.email} is already in the team`);
                        } else {
                          membersForm.controls[index]!.setErrors({unknownError: true});
                          toast.error(`Inviting ${member.email} went wrong`);
                        }

                        return false;
                      },
                    }),
                  ),
              ),
            ).pipe(
              tapResponse({
                next: (statuses) => {
                  patchState(store, setFulfilled());

                  statuses.forEach((status, index) => {
                    if (status) {
                      membersForm.removeAt(index, {emitEvent: true});
                    }
                  });

                  if (statuses.every((it) => !!it)) {
                    dialogRef.close();
                  }

                  teamInvitesStore.load({
                    teamId: teamInvitesStore.teamId(),
                    ...teamInvitesStore.pageable(),
                  });
                },
                error: () => patchState(store, setFulfilled()),
              }),
            ),
          ),
        ),
      ),
      removeSelection: rxMethod<string>(
        switchMap((teamId) =>
          confirmDialog$(translate('general.confirmDelete')).pipe(
            tap(() => patchState(store, setPending())),
            map(() => store.selection().map((it) => ({teamId, userId: it.user.id}))),
            switchMap((paths) =>
              forkJoin(
                paths.map((path) =>
                  api.delete('/v1/team/{teamId}/user/{userId}', {params: {path}}),
                ),
              ).pipe(
                tapResponse({
                  next: () => {
                    patchState(
                      store,
                      setFulfilled(),
                      removeEntities(paths.map((it) => it.userId)),
                      resetSelection(),
                    );

                    toast.success(`Successfully removed user(s)`);
                  },
                  error: (error) => {
                    toast.error(`Could not remove user(s)`);
                    patchState(store, setError(error), setFulfilled());
                  },
                }),
              ),
            ),
          ),
        ),
      ),
    }),
  ),
);
