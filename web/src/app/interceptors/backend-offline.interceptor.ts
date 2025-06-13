import {HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest} from '@angular/common/http';
import {inject} from '@angular/core';

import {Observable, catchError, tap, throwError} from 'rxjs';

import {BackendOfflineService} from '@app/services';

/**
 * Check only this requests
 */
const paths = ['/api/v1'];

export function backendOfflineInterceptor(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  let toIntercept = false;
  for (const path of paths) {
    if (request.url.includes(path)) {
      toIntercept = true;
      break;
    }
  }

  const backendOfflineService = inject(BackendOfflineService);

  if (!toIntercept) {
    return next(request);
  } else {
    return next(request).pipe(
      tap(() => backendOfflineService.set(false)),
      catchError((error) => {
        console.error('HTTP request error', error);
        if (error instanceof HttpErrorResponse) {
          switch (error.status) {
            case 0:
            case 500:
            case 501:
            case 502:
              backendOfflineService.set(true);
          }
        }

        return throwError(() => error);
      }),
    );
  }
}
