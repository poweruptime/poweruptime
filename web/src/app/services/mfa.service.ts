import {inject, signal} from '@angular/core';
import {Router} from '@angular/router';

import {Subject} from 'rxjs';

import {s_fromStorage, st_set} from 'dfts-helper';
import {createInjectable} from 'ngxtension/create-injectable';

const mfaRedirectUrlKey = 'pu_mfa_redirect_url';

export const MFAService = createInjectable(() => {
  const router = inject(Router);

  const mfaCode = new Subject<string>();

  const active = signal(false);

  return {
    setCode: (it: string) => mfaCode.next(it),
    setActive: async (it: boolean) => {
      active.set(it);
      if (it) {
        await router.navigate(['/', 'mfa']);
        st_set(mfaRedirectUrlKey, window.location.href);
      } else {
        await router.navigateByUrl(s_fromStorage(mfaRedirectUrlKey) ?? '/');
      }
    },
    code$: mfaCode.asObservable(),
    active: active.asReadonly(),
  };
});
