import {HttpClient} from '@angular/common/http';
import {computed, inject} from '@angular/core';
import {Router} from '@angular/router';

import {pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withComputed, withMethods, withState} from '@ngrx/signals';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {toast} from '@spartan-ng/brain/sonner';

import {BACKEND_API_URL} from '@app/util';

import {
  MaintenancePayload,
  MaintenanceResponse,
  MaintenanceState,
  PaginatedMaintenanceResponse,
} from './maintenance.types';

export const MaintenanceStore = signalStore(
  withState<{
    maintenances: MaintenanceResponse[];
    maintenance: MaintenanceResponse | undefined;
    state: MaintenanceState;
    loading: boolean;
    error: unknown;
  }>({
    maintenances: [],
    maintenance: undefined,
    state: 'UPCOMING',
    loading: false,
    error: undefined,
  }),
  withComputed(({maintenances}) => ({
    isEmpty: computed(() => maintenances().length === 0),
  })),
  withMethods((store, http = inject(HttpClient), router = inject(Router)) => ({
    setState(state: MaintenanceState) {
      patchState(store, {state});
    },
    load: rxMethod<{teamId: string | undefined; state: MaintenanceState}>(
      pipe(
        tap(({state}) => patchState(store, {loading: true, state})),
        switchMap(({teamId, state}) =>
          http
            .get<PaginatedMaintenanceResponse>(`${BACKEND_API_URL}/v1/maintenance`, {
              params: {
                teamId: teamId ?? '',
                state,
                page: 0,
                size: 100,
              },
            })
            .pipe(
              tapResponse({
                next: (response) =>
                  patchState(store, {
                    maintenances: response.data,
                    loading: false,
                    error: undefined,
                  }),
                error: (error) => patchState(store, {loading: false, error}),
              }),
            ),
        ),
      ),
    ),
    loadById: rxMethod<string | undefined>(
      pipe(
        tap(() => patchState(store, {loading: true, maintenance: undefined})),
        switchMap((id) =>
          http.get<MaintenanceResponse>(`${BACKEND_API_URL}/v1/maintenance/${id}`).pipe(
            tapResponse({
              next: (maintenance) => patchState(store, {maintenance, loading: false}),
              error: (error) => patchState(store, {loading: false, error}),
            }),
          ),
        ),
      ),
    ),
    create: rxMethod<MaintenancePayload>(
      switchMap((body) =>
        http.post<MaintenanceResponse>(`${BACKEND_API_URL}/v1/maintenance`, body).pipe(
          tapResponse({
            next: (maintenance) => {
              toast.success('Maintenance created.');
              void router.navigate(['../', maintenance.id]);
            },
            error: (error) => patchState(store, {error}),
          }),
        ),
      ),
    ),
    update: rxMethod<MaintenancePayload>(
      switchMap((body) =>
        http.put<MaintenanceResponse>(`${BACKEND_API_URL}/v1/maintenance`, body).pipe(
          tapResponse({
            next: (maintenance) => {
              patchState(store, {maintenance});
              toast.success('Maintenance updated.');
            },
            error: (error) => patchState(store, {error}),
          }),
        ),
      ),
    ),
    delete: rxMethod<string>(
      switchMap((id) =>
        http.delete(`${BACKEND_API_URL}/v1/maintenance/${id}`).pipe(
          tapResponse({
            next: () => {
              patchState(store, {
                maintenances: store.maintenances().filter((maintenance) => maintenance.id !== id),
              });
              toast.success('Maintenance deleted.');
            },
            error: (error) => patchState(store, {error}),
          }),
        ),
      ),
    ),
  })),
);
