import {HttpClient} from '@angular/common/http';
import {computed, inject} from '@angular/core';

import {MatDialog} from '@angular/material/dialog';

import {pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withProps,
} from '@ngrx/signals';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {injectLocalStorage} from 'ngxtension/inject-local-storage';

import {ChangelogDialog} from '@app/components';
import {BACKEND_API_URL} from '@app/util';
import {environment} from '@app/util';

import {BackendOperation} from '../api';
import {InfoStore} from './info.store';
import {setError, setFulfilled, setPending, withRequestStatus} from './store-features';

export const ChangelogStore = signalStore(
  {providedIn: 'root'},
  withRequestStatus(),
  withProps(() => ({
    lastVersion: injectLocalStorage<string>('pu_last_version'),
  })),
  withComputed((store, infoStore = inject(InfoStore)) => ({
    newVersionChangelogAvailable: computed(() => {
      if (!infoStore.showNewVersionDialog()) {
        return false;
      }

      const currentVersion = environment.version;
      const lastVersion = store.lastVersion();
      if (!lastVersion) {
        store.lastVersion.set(currentVersion);
        return false;
      }
      return environment.version !== store.lastVersion();
    }),
  })),
  withMethods((store, httpClient = inject(HttpClient), dialog = inject(MatDialog)) => ({
    load: rxMethod<string | undefined>(
      pipe(
        tap(() => patchState(store, setPending())),
        switchMap((version) =>
          httpClient.get(`${BACKEND_API_URL}/v1/public/changelog`, {
            responseType: 'text',
            params: {
              ...(version ? {version} : {}),
              beta: environment.isBetaOrDevChannel,
            } satisfies BackendOperation['getChangelog']['parameters']['query'],
          }),
        ),
        tapResponse({
          next: (changelog) => {
            patchState(store, setFulfilled());
            dialog.open(ChangelogDialog, {data: {changelog}});
          },
          error: (error) => patchState(store, setError(error)),
        }),
      ),
    ),
  })),
  withHooks({
    onInit(_, infoStore = inject(InfoStore)) {
      infoStore.loadShowNewVersionDialog();
    },
  }),
);
