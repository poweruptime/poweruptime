import {ChangeDetectionStrategy, Component, booleanAttribute, inject, input} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';

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
  protected readonly preview = input(false, {transform: booleanAttribute});

  protected readonly refreshToken = input<string>();
  protected readonly accessToken = input<string>();

  constructor() {
    if (!this.preview()) {
      this.authStore.oauth2Login({
        refreshToken: this.refreshToken(),
        accessToken: this.accessToken(),
      });
    }
  }
}
