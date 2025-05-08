import {ChangeDetectionStrategy, Component, booleanAttribute, inject, input} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';
import {injectQueryParams} from 'ngxtension/inject-query-params';

import {EmailChangeStore} from '@app/services';

@Component({
  template: `
    <div class="flex h-screen items-center">
      <div class="w-full text-center">
        <h1 class="text-6xl">{{ 'general.redirecting' | transloco }}</h1>
      </div>
    </div>
  `,
  selector: 'pu-email-change-confirm-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [EmailChangeStore],
  imports: [TranslocoPipe],
})
export class EmailChangeConfirmPage {
  private readonly emailChangeStore = inject(EmailChangeStore);
  readonly confirmToken = input.required<string>();

  readonly preview = injectQueryParams('preview', {transform: booleanAttribute});

  constructor() {
    if (!this.preview()) {
      this.emailChangeStore.confirm(this.confirmToken);
    }
  }
}
