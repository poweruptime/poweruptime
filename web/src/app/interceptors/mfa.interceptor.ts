import {HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest} from '@angular/common/http';
import {inject} from '@angular/core';

import {BehaviorSubject, Observable, catchError, filter, switchMap, tap, throwError} from 'rxjs';

import {HlmDialogService} from '@spartan-ng/helm/dialog';
import {loggerOf} from 'dfts-helper';

import {MFACheckDialog} from '@app/components';

const nextMFACode$ = new BehaviorSubject<string | undefined>(undefined);

export function mfaInterceptor(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  const lumber = loggerOf('mfaInterceptor');
  const dialog = inject(HlmDialogService);

  return next(request).pipe(
    catchError((error) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 403 &&
        error.error?.codeName === 'MFA_CODE_REQUIRED'
      ) {
        return dialog.open(MFACheckDialog).closed$.pipe(
          tap((code) => console.log('MFACheckDialog return value ', code)),
          filter((code): code is string => !!code),
          switchMap((code) => {
            lumber.info('handleMFACodeRequired', 'Code supplied', code);
            nextMFACode$.next(code);

            return next(addMFACode(request, code));
          }),
        );
      }

      return throwError(() => error as unknown);
    }),
  );
}

const addMFACode = (req: HttpRequest<unknown>, code: string): HttpRequest<unknown> =>
  req.clone({
    setHeaders: {
      'X-MFA-Code': code,
    },
  });
