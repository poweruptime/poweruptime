import {toObservable} from '@angular/core/rxjs-interop';

import {filter, pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withMethods, withProps, withState} from '@ngrx/signals';
import {rxMethod} from '@ngrx/signals/rxjs-interop';

import {setError, setFulfilled, setPending, withRequestStatus} from '@app/services/store-features';

import {BackendType, injectAPI} from '../api';

export const InfoStore = signalStore(
  {providedIn: 'root'},
  withState<{
    host: string | undefined;
    version: string | undefined;
    oauth2Providers: BackendType['OAuth2ProviderResponse'][];
    isSetup: boolean | undefined;
    support: BackendType['InfoSupportResponse'] | undefined;
    time: BackendType['InfoTimeResponse'] | undefined;
    isUserAllowedToCreateTeams: boolean | undefined;
    showNewVersionDialog: boolean | undefined;
    environment: BackendType['InfoAdminResponse'] | undefined;
  }>({
    host: undefined,
    version: undefined,
    oauth2Providers: [],
    isSetup: undefined,
    support: undefined,
    time: undefined,
    isUserAllowedToCreateTeams: undefined,
    showNewVersionDialog: undefined,
    environment: undefined,
  }),
  withRequestStatus(),
  withProps(({host, showNewVersionDialog}) => ({
    host$: toObservable(host).pipe(filter((it): it is string => !!it)),
    showNewVersionDialog$: toObservable(showNewVersionDialog).pipe(
      filter((it): it is boolean => it !== undefined),
    ),
  })),
  withMethods((store, api = injectAPI()) => ({
    loadHost: rxMethod<void>(
      pipe(
        tap(() => patchState(store, setPending())),
        switchMap(() =>
          api.get('/v1/public/info/host').pipe(
            tapResponse({
              next: ({it: host}) => patchState(store, {host}, setFulfilled()),
              error: (error) => patchState(store, setError(error)),
            }),
          ),
        ),
      ),
    ),
    loadVersion: rxMethod<void>(
      pipe(
        tap(() => patchState(store, setPending())),
        switchMap(() =>
          api.get('/v1/public/info/version').pipe(
            tapResponse({
              next: ({it: version}) => patchState(store, {version}, setFulfilled()),
              error: (error) => patchState(store, setError(error)),
            }),
          ),
        ),
      ),
    ),
    loadOAuth2Providers: rxMethod<void>(
      pipe(
        tap(() => patchState(store, setPending())),
        switchMap(() =>
          api.get('/v1/public/info/oauth2').pipe(
            tapResponse({
              next: (oauth2Providers) => patchState(store, {oauth2Providers}, setFulfilled()),
              error: (error) => patchState(store, setError(error)),
            }),
          ),
        ),
      ),
    ),
    loadIsSetup: rxMethod<void>(
      pipe(
        tap(() => patchState(store, setPending())),
        switchMap(() =>
          api.get('/v1/public/info/is-setup').pipe(
            tapResponse({
              next: ({it: isSetup}) => patchState(store, {isSetup}, setFulfilled()),
              error: (error) => patchState(store, setError(error)),
            }),
          ),
        ),
      ),
    ),
    loadSupport: rxMethod<void>(
      pipe(
        tap(() => patchState(store, setPending())),
        filter(() => store.support() === undefined),
        switchMap(() =>
          api.get('/v1/public/info/support').pipe(
            tapResponse({
              next: (support) => patchState(store, {support}, setFulfilled()),
              error: (error) => patchState(store, setError(error)),
            }),
          ),
        ),
      ),
    ),
    resetSupport() {
      patchState(store, {support: undefined});
    },
    loadTime: rxMethod<void>(
      pipe(
        tap(() => patchState(store, setPending())),
        switchMap(() =>
          api.get('/v1/info/time').pipe(
            tapResponse({
              next: (time) => patchState(store, {time}, setFulfilled()),
              error: (error) => patchState(store, setError(error)),
            }),
          ),
        ),
      ),
    ),
    loadIsUserAllowedToCreateTeams: rxMethod<void>(
      pipe(
        tap(() => patchState(store, setPending())),
        filter(() => store.isUserAllowedToCreateTeams() === undefined),
        switchMap(() =>
          api.get('/v1/info/isUserAllowedToCreateTeams').pipe(
            tapResponse({
              next: ({it: isUserAllowedToCreateTeams}) =>
                patchState(store, {isUserAllowedToCreateTeams}, setFulfilled()),
              error: (error) => patchState(store, setError(error)),
            }),
          ),
        ),
      ),
    ),
    resetIsUserAllowedToCreateTeams() {
      patchState(store, {isUserAllowedToCreateTeams: undefined});
    },
    loadShowNewVersionDialog: rxMethod<void>(
      pipe(
        tap(() => patchState(store, setPending())),
        filter(() => store.showNewVersionDialog() === undefined),
        switchMap(() =>
          api.get('/v1/info/showNewVersionDialog').pipe(
            tapResponse({
              next: ({it: showNewVersionDialog}) =>
                patchState(store, {showNewVersionDialog}, setFulfilled()),
              error: (error) => patchState(store, setError(error)),
            }),
          ),
        ),
      ),
    ),
    resetShowNewVersionDialog() {
      patchState(store, {showNewVersionDialog: undefined});
    },
    loadEnvironment: rxMethod<void>(
      pipe(
        tap(() => patchState(store, setPending())),
        switchMap(() =>
          api.get('/v1/info/environment').pipe(
            tapResponse({
              next: (environment) => patchState(store, {environment}, setFulfilled()),
              error: (error) => patchState(store, setError(error)),
            }),
          ),
        ),
      ),
    ),
  })),
);
