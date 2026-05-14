import {ChangeDetectionStrategy, Component, booleanAttribute, inject, input} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';
import {toast} from '@spartan-ng/brain/sonner';

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

  protected readonly code = input<string>();
  protected readonly error = input<string>();

  constructor() {
    const error = this.error();
    if (error) {
      switch (error) {
        case 'not_activated':
          toast.error('Account deactivated. Contact an admin to regain access.');
          break;
        default:
          toast.error(`OAuth login failed for unknown reasons: "${error}"`);
          break;
      }
    } else if (!this.preview()) {
      this.authStore.oauth2Login(this.code);
    }
  }
}
