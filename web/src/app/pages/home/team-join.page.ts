import {ChangeDetectionStrategy, Component, inject, input} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';

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

  constructor() {
    this.teamJoinStore.join(this.token);
  }
}
