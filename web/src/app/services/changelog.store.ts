import {HttpClient} from '@angular/common/http';
import {inject} from '@angular/core';

import {MatDialog} from '@angular/material/dialog';

import {filter, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withMethods, withProps} from '@ngrx/signals';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {injectLocalStorage} from 'ngxtension/inject-local-storage';

import {ChangelogDialog} from '@app/components';
import {BACKEND_API_URL} from '@app/util';
import {environment} from '@app/util';

import {BackendOperation} from '../api';
import {InfoStore} from './info.store';
import {setError, setFulfilled, setPending, withRequestStatus} from './store-features';

interface LoadOptions {
  version: string | undefined;
  newVersion: boolean;
}

export const ChangelogStore = signalStore(
  {providedIn: 'root'},
  withRequestStatus(),
  withProps(() => ({
    lastVersion: injectLocalStorage<string>('pu_last_version'),
    showDialogOnNewVersion: injectLocalStorage('pu_last_version_show_dialog_on_new_version', {
      defaultValue: true,
    }),
  })),
  withMethods(
    (
      store,
      httpClient = inject(HttpClient),
      infoStore = inject(InfoStore),
      dialog = inject(MatDialog),
    ) => {
      function showNewChangelog(): boolean {
        if (!store.showDialogOnNewVersion()) {
          return false;
        }

        const currentVersion = environment.version;
        const lastVersion = store.lastVersion();
        if (!lastVersion) {
          store.lastVersion.set(currentVersion);
          return false;
        }
        return environment.version !== store.lastVersion();
      }

      function load$({version, newVersion}: LoadOptions) {
        patchState(store, setPending());

        return httpClient
          .get(`${BACKEND_API_URL}/v1/changelog`, {
            responseType: 'text',
            params: {
              ...(version ? {version} : {}),
              beta: environment.isBetaOrDevChannel,
            } satisfies BackendOperation['getChangelog']['parameters']['query'],
          })
          .pipe(
            tapResponse({
              next: (changelog) => {
                patchState(store, setFulfilled());
                dialog.open(ChangelogDialog, {data: {changelog, newVersion}});
              },
              error: (error) => patchState(store, setError(error)),
            }),
          );
      }

      const showNewVersionDialog = rxMethod<LoadOptions>(
        switchMap((options) => {
          infoStore.loadShowNewVersionDialog();

          return infoStore.showNewVersionDialog$.pipe(
            filter((showNewVersionDialog) => showNewVersionDialog && showNewChangelog()),
            switchMap(() => load$(options)),
            tap(() => store.lastVersion.set(environment.version)),
          );
        }),
      );

      const load = rxMethod<LoadOptions>(switchMap((options) => load$(options)));

      return {
        showNewVersionDialog,
        load,
      };
    },
  ),
);
