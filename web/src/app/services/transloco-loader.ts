import {HttpClient} from '@angular/common/http';
import {Injectable, inject} from '@angular/core';

import {Translation, TranslocoLoader} from '@jsverse/transloco';

import {environment} from '../../environments/environment';

@Injectable({providedIn: 'root'})
export class TranslocoHttpLoader implements TranslocoLoader {
  private http = inject(HttpClient);
  private baseUrl = environment.baseUrl;

  getTranslation(lang: string) {
    return this.http.get<Translation>(`${this.baseUrl}/assets/i18n/${lang}.json`);
  }
}
