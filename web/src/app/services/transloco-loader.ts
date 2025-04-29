import {HttpClient} from '@angular/common/http';
import {Injectable, inject} from '@angular/core';

import {Translation, TranslocoLoader} from '@jsverse/transloco';

import {injectIsPlatformDocker} from '@app/services/platform.service';
import {DOCKER_WEB_URL} from '@app/util';

@Injectable({providedIn: 'root'})
export class TranslocoHttpLoader implements TranslocoLoader {
  private http = inject(HttpClient);

  private url = '';

  getTranslation(lang: string) {
    return this.http.get<Translation>(`${this.url}/assets/i18n/${lang}.json`);
  }
}
