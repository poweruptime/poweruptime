import {inject} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

import {distinctUntilChanged, filter, pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withMethods, withState} from '@ngrx/signals';
import {rxMethod} from '@ngrx/signals/rxjs-interop';

import {BackendType, injectAPI} from '@app/api';
import {setError, setFulfilled, setPending, withRequestStatus} from '@app/services/store-features';

import {SelectedTeamStore} from './selected-team.store';

export const TeamEditStore = signalStore(
  withRequestStatus(),
  withState<{
    team: BackendType['TeamResponse'] | undefined;
  }>({
    team: undefined,
  }),
  withMethods(
    (
      store,
      router = inject(Router),
      relativeTo = inject(ActivatedRoute),
      api = injectAPI(),
      selectedTeamStore = inject(SelectedTeamStore),
    ) => ({
      loadById: rxMethod<string | undefined>(
        pipe(
          filter((it): it is string => !!it),
          distinctUntilChanged(),
          tap(() => patchState(store, setPending(), () => ({team: undefined}))),
          switchMap((id) =>
            api
              .get('/v1/team/{id}', {
                params: {
                  path: {
                    id,
                  },
                },
              })
              .pipe(
                tapResponse({
                  next: (team) => patchState(store, () => ({team}), setFulfilled()),
                  error: (error) => patchState(store, setError(error)),
                }),
              ),
          ),
        ),
      ),
      create: rxMethod<BackendType['CreateTeamDto']>(
        switchMap((body) =>
          api.post('/v1/team', {body}).pipe(
            tapResponse({
              next: (team) => {
                selectedTeamStore.updateTeam(team);

                void router.navigate(['../', team.id], {relativeTo});
              },
              error: () => {},
            }),
          ),
        ),
      ),
      update: rxMethod<BackendType['UpdateTeamDto']>(
        switchMap((body) =>
          api.put('/v1/team', {body}).pipe(
            tapResponse({
              next: (team) => {
                selectedTeamStore.updateTeam(team);
                patchState(store, () => ({team}));
              },
              error: () => {},
            }),
          ),
        ),
      ),
    }),
  ),
);
