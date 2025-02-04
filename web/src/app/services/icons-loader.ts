import {isPlatformBrowser} from '@angular/common';
import {HttpClient, HttpContext, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {PLATFORM_ID, Provider, inject} from '@angular/core';

import {Observable, catchError, of} from 'rxjs';

import {ICONS_LOADER, ICON_CACHE_INTERCEPTOR} from 'dfx-bootstrap-icons';

import {environment} from '../../environments/environment';

export function provideIconsLoader(): Provider {
  return {
    provide: ICONS_LOADER,
    useFactory: (): ((name: string) => Observable<string | undefined>) => {
      const httpClient = inject(HttpClient);
      const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

      return (name: string): Observable<string | undefined> => {
        return httpClient
          .get<string>(
            `${
              environment.production && !isBrowser
                ? 'http://poweruptime-web:4200/assets/icons'
                : '/assets/icons'
            }/${name}.svg`,
            {
              headers: new HttpHeaders().set('Content-Type', 'text/plain; charset=utf-8'),
              context: new HttpContext().set(ICON_CACHE_INTERCEPTOR, true),
              // @ts-expect-error Weird angular things
              responseType: 'text',
            },
          )
          .pipe(
            catchError((error: HttpErrorResponse) => {
              console.warn(`BiComponent: Failed loading icon "${name}"`, error);
              if (error.status === 404) {
                console.warn(`BiComponent: Icon "${name}" not found`);
              }
              return of(undefined);
            }),
          ) as unknown as Observable<string | undefined>;
      };
    },
  };
}
