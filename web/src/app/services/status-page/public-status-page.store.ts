import {pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withMethods, withState} from '@ngrx/signals';
import {rxMethod} from '@ngrx/signals/rxjs-interop';

import {BackendType, injectAPI} from '@app/api';

import {setError, setFulfilled, setPending, withRequestStatus} from '../store-features';

export const PublicStatusPageStore = signalStore(
  {providedIn: 'root'},
  withRequestStatus(),
  withState<{
    statusPage: BackendType['PublicStatusPageResponse'] | undefined;
  }>({
    statusPage: undefined,
  }),
  withMethods((store, api = injectAPI()) => ({
    loadBySlug: rxMethod<{
      slug?: string;
      domain: string;
    }>(
      pipe(
        tap(() => patchState(store, setPending(), () => ({statusPage: undefined}))),
        switchMap(({slug, domain}) =>
          (slug
            ? api.get('/v1/public/status-page/{slug}', {
                params: {
                  path: {
                    slug,
                  },
                },
              })
            : api.get('/v1/public/status-page/byDomain/{domain}', {
                params: {
                  path: {
                    domain,
                  },
                },
              })
          ).pipe(
            tapResponse({
              next: (statusPage) => patchState(store, () => ({statusPage}), setFulfilled()),
              error: (error) => patchState(store, setError(error)),
            }),
          ),
        ),
      ),
    ),
  })),
);
