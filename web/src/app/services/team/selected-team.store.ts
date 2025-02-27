import {computed} from '@angular/core';

import {debounceTime, distinctUntilChanged, map, mergeMap, of, pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withComputed, withMethods, withState} from '@ngrx/signals';
import {removeAllEntities, setEntities, setEntity, withEntities} from '@ngrx/signals/entities';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {toast} from 'ngx-sonner';

import {BackendType, injectAPI} from '@app/api';
import {setError, setFulfilled, setPending, withRequestStatus} from '@app/services/store-features';

type SelectedTeamState = {
  selectedTeam: BackendType['TeamResponse'] | undefined;
};

export const SelectedTeamStore = signalStore(
  {providedIn: 'root'},
  withState<{
    loadedAll: boolean;
    page: number;
    search: string;
  }>({
    loadedAll: false,
    page: 0,
    search: '',
  }),
  withRequestStatus(),
  withEntities<BackendType['TeamResponse']>(),
  withState({selectedTeam: undefined} as SelectedTeamState),
  withMethods((store, api = injectAPI()) => ({
    updateTeam(team: BackendType['TeamResponse']) {
      if (store.selectedTeam()?.id === team.id) {
        patchState(store, () => ({selectedTeam: team}));
      }
      patchState(store, setEntity(team));
    },
    nextPage(): void {
      if (!store.loadedAll()) {
        patchState(store, (state) => ({page: state.page + 1}));
      }
    },
    setSearch: rxMethod<string | null>(
      pipe(
        debounceTime(400),
        map((it) => it ?? ''),
        tap((search) => patchState(store, () => ({search}))),
      ),
    ),
    loadAvailableTeams: rxMethod<{
      page: number;
      search: string;
      size: number;
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
        mergeMap(({page, search, size}) =>
          api
            .get('/v1/team', {
              params: {
                query: {
                  page,
                  size,
                  name: search.length > 0 ? search : undefined,
                  sort: ['personalUser.id,ASC', 'name,ASC,ignorecase'],
                },
              },
            })
            .pipe(
              tapResponse({
                next: ({data, numberOfPages}) =>
                  patchState(store, setEntities(data), setFulfilled(), (state) => {
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
                  next: (response) => patchState(store, () => ({selectedTeam: response})),
                  error: () => {},
                }),
              )
            : of(true).pipe(tap(() => patchState(store, () => ({selectedTeam: undefined})))),
        ),
      ),
    ),
  })),
  withComputed(({selectedTeam, entities}) => ({
    selectedTeamId: computed(() => selectedTeam()?.id),
    personalTeam: computed(() => entities()?.find((team) => team.personal)),
    sortedEntities: computed(() =>
      entities().sort((a, b) => {
        if (a.personal && !b.personal) {
          return -1;
        } else if (!a.personal && b.personal) {
          return 1;
        } else {
          return a.name.toLowerCase().localeCompare(b.name.toLowerCase(), undefined, {
            numeric: true,
            sensitivity: 'base',
          });
        }
      }),
    ),
    sortedEntitiesWithoutPersonal: computed(() =>
      entities()
        .filter((it) => !it.personal)
        .sort((a, b) =>
          a.name.toLowerCase().localeCompare(b.name.toLowerCase(), undefined, {
            numeric: true,
            sensitivity: 'base',
          }),
        ),
    ),
  })),
);
