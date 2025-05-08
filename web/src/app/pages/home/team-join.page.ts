import {ChangeDetectionStrategy, Component, booleanAttribute, inject, input} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';
import {injectQueryParams} from 'ngxtension/inject-query-params';

import {TeamJoinStore} from '@app/services';

@Component({
  template: `
    <div class="flex h-screen items-center">
      <div class="w-full text-center">
        <h1 class="text-6xl">{{ 'general.redirecting' | transloco }}</h1>
      </div>
    </div>
  `,
  selector: 'pu-team-invite-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe],
})
export class TeamJoinPage {
  private readonly teamJoinStore = inject(TeamJoinStore);

  readonly token = input<string>();

  readonly preview = injectQueryParams('preview', {transform: booleanAttribute});

  constructor() {
    if (!this.preview()) {
      this.teamJoinStore.join(this.token);
    }
  }
}
