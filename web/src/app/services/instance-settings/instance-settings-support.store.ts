import {inject} from '@angular/core';

import {pipe, switchMap, tap} from 'rxjs';

import {translate} from '@jsverse/transloco';
import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withMethods} from '@ngrx/signals';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import confetti from 'canvas-confetti';
import {toast} from 'ngx-sonner';

import {BackendType, injectAPI} from '@app/api';
import {setError, setFulfilled, setPending, withRequestStatus} from '@app/services/store-features';

import {JsonStore} from '../json.store';
import {InstanceSettingsStore} from './instance-settings.store';

export const InstanceSettingsSupportStore = signalStore(
  {providedIn: 'root'},
  withRequestStatus(),
  withMethods(
    (
      store,
      api = injectAPI(),
      jsonStore = inject(JsonStore),
      instanceSettingsStore = inject(InstanceSettingsStore),
    ) => ({
      setSupport: rxMethod<BackendType['InstanceSettingSupportDto']>(
        pipe(
          tap(() => patchState(store, setPending())),
          switchMap((body) =>
            api.put('/v1/instance-settings/support', {body}).pipe(
              tapResponse({
                next: (response) => {
                  if (instanceSettingsStore.settings()?.supportLookup !== body.supportLookup) {
                    if (response.check) {
                      toast.success(translate('instanceSettings.sponsorship.success'));

                      confetti({
                        particleCount: 100,
                        spread: 160,
                        origin: {y: 0.6},
                      });
                      setTimeout(() => confetti.reset(), 3000);
                    } else if ((body.supportLookup?.length ?? 0) > 0) {
                      toast.error(translate('instanceSettings.sponsorship.failed'));
                    }
                  }

                  instanceSettingsStore.setSettings(response.instanceSettings);
                  patchState(store, setFulfilled());
                  jsonStore.refresh();
                },
                error: (error) => patchState(store, setError(error)),
              }),
            ),
          ),
        ),
      ),
    }),
  ),
);
