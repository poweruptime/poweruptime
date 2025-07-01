import {ChangeDetectionStrategy, Component, booleanAttribute, inject} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';
import {injectQueryParams} from 'ngxtension/inject-query-params';

import {AuthStore} from '@app/services';

@Component({
  template: `
    <h1 class="text-6xl">{{ 'general.redirecting' | transloco }}</h1>
  `,
  selector: 'pu-oauth2-callback-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe],
})
export class OAuth2CallbackPage {
  private readonly authStore = inject(AuthStore);
  readonly preview = injectQueryParams('preview', {transform: booleanAttribute});

  readonly tokens = injectQueryParams((params) => ({
    refreshToken: params['refreshToken'] as string | undefined,
    accessToken: params['accessToken'] as string | undefined,
  }));

  constructor() {
    if (!this.preview()) {
      this.authStore.oauth2Login(this.tokens);
    }
  }
}
