import {HttpClient} from '@angular/common/http';
import {inject} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';

import {filter, pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withMethods, withProps} from '@ngrx/signals';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {injectLocalStorage} from 'ngxtension/inject-local-storage';

import {setError, setFulfilled, setPending, withRequestStatus} from '@app/services/store-features';

import {environment} from '../../environments/environment';
import {ChangelogDialog} from '../components';
import {BACKEND_API_URL} from '../util';

export const ChangelogStore = signalStore(
  {providedIn: 'root'},
  withRequestStatus(),
  withProps(() => ({
    lastVersion: injectLocalStorage<string>('pu_last_version'),
  })),
  withMethods((store, httpClient = inject(HttpClient), dialog = inject(MatDialog)) => ({
    load: rxMethod<void>(
      pipe(
        filter(() => {
          const currentVersion = environment.version;
          const lastVersion = store.lastVersion();
          if (!lastVersion) {
            store.lastVersion.set(currentVersion);
            return false;
          }
          return environment.version !== store.lastVersion();
        }),
        tap(() => patchState(store, setPending())),
        switchMap(() =>
          httpClient
            .get(`${BACKEND_API_URL}/v1/changelog`, {
              responseType: 'text',
              params: {version: store.lastVersion()!},
            })
            .pipe(
              tapResponse({
                next: (changelog) => {
                  store.lastVersion.set(environment.version);
                  patchState(store, setFulfilled());
                  dialog.open(ChangelogDialog, {data: {changelog}});
                  console.log(changelog);
                },
                error: (error) => patchState(store, setError(error)),
              }),
            ),
        ),
      ),
    ),
  })),
);
