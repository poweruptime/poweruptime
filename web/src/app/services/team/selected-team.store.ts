import {computed, effect, inject} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

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
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import {removeAllEntities, setEntities, setEntity, withEntities} from '@ngrx/signals/entities';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {toast} from 'ngx-sonner';

import {BackendType, injectAPI} from '@app/api';
import {PushService} from '@app/services';
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
    onceSelectedTeams: BackendType['TeamResponse'][];
  }>({
    loadedAll: false,
    page: 0,
    search: '',
    onceSelectedTeams: [],
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
    removeSelectedTeam(id: string): void {
      patchState(store, ({onceSelectedTeams}) => ({
        onceSelectedTeams: onceSelectedTeams.filter((it) => it.id !== id),
      }));
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
                  next: (selectedTeam) =>
                    patchState(store, ({onceSelectedTeams}) => ({
                      selectedTeam,
                      onceSelectedTeams: !!onceSelectedTeams.find(
                        (team) => team.id === selectedTeam.id,
                      )
                        ? onceSelectedTeams
                        : [selectedTeam, ...onceSelectedTeams],
                    })),
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
    personalTeam: computed(() => entities()?.find((team) => team.personal)),
    onceSelectedTeamsCut: computed(() => onceSelectedTeams().slice(0, 5)),
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
  withHooks({
    onInit(store) {
      patchState(store, () => ({
        onceSelectedTeams: JSON.parse(
          localStorage.getItem('pu_once_selected_teams') ?? '[]',
        ) as BackendType['TeamResponse'][],
      }));

      effect(() => {
        localStorage.setItem('pu_once_selected_teams', JSON.stringify(store.onceSelectedTeams()));
      });
    },
  }),
);
