import {computed, inject} from '@angular/core';
import {Router} from '@angular/router';

import {
  EMPTY,
  debounceTime,
  distinctUntilChanged,
  map,
  mergeMap,
  of,
  pipe,
  switchMap,
  tap,
} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import {removeAllEntities, setEntities, setEntity, withEntities} from '@ngrx/signals/entities';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {toast} from 'ngx-sonner';
import {injectLocalStorage} from 'ngxtension/inject-local-storage';

import {BackendType, injectAPI} from '@app/api';
import {setError, setFulfilled, setPending, withRequestStatus} from '@app/services/store-features';

interface SelectedTeamState {
  selectedTeam: BackendType['TeamMaxResponse'] | undefined;
}

export const SelectedTeamStore = signalStore(
  {providedIn: 'root'},
  withState<{
    loadedAll: boolean;
    page: number;
    search: string | undefined;
  }>({
    loadedAll: false,
    page: 0,
    search: undefined,
  }),
  withProps(() => ({
    storageSelectedTeamId: injectLocalStorage<string>('pu_selected_team_id'),
    onceSelectedTeams: injectLocalStorage<BackendType['TeamMaxResponse'][]>(
      'pu_once_selected_teams',
      {
        defaultValue: [],
      },
    ),
  })),
  withRequestStatus(),
  withEntities<BackendType['TeamResponse']>(),
  withState({selectedTeam: undefined} as SelectedTeamState),
  withMethods((store, api = injectAPI(), router = inject(Router)) => ({
    updateTeam(team: BackendType['TeamMaxResponse']) {
      if (store.selectedTeam()?.id === team.id) {
        patchState(store, () => ({selectedTeam: team}));
      }
      patchState(store, setEntity<BackendType['TeamResponse']>(team));
    },
    nextPage(): void {
      if (!store.loadedAll()) {
        patchState(store, (state) => ({page: state.page + 1}));
      }
    },
    removeSelectedTeam(id: string): void {
      store.onceSelectedTeams.update((it) => it.filter((it) => it.id !== id));

      if (store.selectedTeam()?.id === id) {
        if (store.onceSelectedTeams().length > 0) {
          const newTeam = store.onceSelectedTeams()[0];

          const current = router.url; // e.g. "/org/5/t/123/dashboard"
          const teamSegmentRe = /t\/[^/;?]+/;

          let routerPromise: Promise<unknown>;

          if (teamSegmentRe.test(current)) {
            // replace "t/{oldId}" with "t/{newTeamId}"
            const updated = current.replace(teamSegmentRe, `t/${newTeam.id}`);
            routerPromise = router.navigateByUrl(updated);
          } else {
            // no match → go directly to "/t/{newTeamId}"
            routerPromise = router.navigate(['/', 't', newTeam.id], {
              queryParamsHandling: 'preserve',
              preserveFragment: true,
            });
          }
          void routerPromise.then(() => patchState(store, () => ({selectedTeam: newTeam})));

          return;
        }

        console.log('No more teams to select, redirecting to /m');

        store.storageSelectedTeamId.set(undefined);

        patchState(store, () => ({selectedTeam: undefined}));

        void router.navigate(['m']);
      }
    },
    setSearch: rxMethod<string | null>(
      pipe(
        debounceTime(275),
        map((it) => it ?? undefined),
        tap((search) => patchState(store, () => ({search}))),
      ),
    ),
    loadAvailableTeams: rxMethod<{
      page: number;
      search: string | undefined;
    }>(
      pipe(
        distinctUntilChanged((prev, cur) => {
          if (prev.search !== cur.search) {
            patchState(store, removeAllEntities(), () => ({page: 0}));
            return false;
          }

          return prev.page === cur.page;
        }),
        tap(() => patchState(store, setPending())),
        mergeMap(({page, ...query}) =>
          api
            .get('/v1/team', {
              params: {
                query: {
                  ...query,
                  size: 60,
                  sort: ['personalUser.id_asc', 'name_asc'],
                },
              },
            })
            .pipe(
              tapResponse({
                next: ({data, numberOfPages}) =>
                  patchState(store, setEntities(data), setFulfilled(), () => {
                    if (numberOfPages === page) {
                      console.warn('Loaded all teams');
                      return {loadedAll: true};
                    }
                    return {};
                  }),
                error: (error) => {
                  patchState(store, setError(error));
                  toast.error(`Error while loading teams page ${page}`);
                },
              }),
            ),
        ),
      ),
    ),
    loadSelectedTeam: rxMethod<string | undefined>(
      pipe(
        switchMap((id) =>
          id
            ? api.get('/v1/team/{id}', {params: {path: {id}}}).pipe(
                tapResponse({
                  next: (selectedTeam) => {
                    patchState(store, () => ({
                      selectedTeam,
                    }));

                    if (!store.onceSelectedTeams().find((team) => team.id === selectedTeam.id)) {
                      store.onceSelectedTeams.update((it) => [...it, selectedTeam]);
                    }
                  },
                  error: () => {},
                }),
              )
            : of(EMPTY).pipe(tap(() => patchState(store, () => ({selectedTeam: undefined})))),
        ),
      ),
    ),
  })),
  withComputed(({selectedTeam, entities, onceSelectedTeams}) => ({
    selectedTeamId: computed(() => selectedTeam()?.id),
    onceSelectedTeamsCut: computed(() => onceSelectedTeams().slice(0, 5)),
    sortedEntities: computed(() =>
      entities().sort((a, b) => {
        if (a.yourPersonal && !b.yourPersonal) {
          return -1;
        } else if (!a.yourPersonal && b.yourPersonal) {
          return 1;
        } else {
          return a.name.toLowerCase().localeCompare(b.name.toLowerCase(), undefined, {
            numeric: true,
            sensitivity: 'base',
          });
        }
      }),
    ),
  })),
);
