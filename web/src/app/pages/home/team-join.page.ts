import {ChangeDetectionStrategy, Component, inject, input} from '@angular/core';

import {TeamJoinStore} from '@app/services/team-join.store';

@Component({
  template: `
    <div class="flex h-screen items-center">
      <div class="w-full text-center">
        <h1 class="text-6xl">Redirecting...</h1>
      </div>
    </div>
  `,
  providers: [TeamJoinStore],
  selector: 'pu-team-invite-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamJoinPage {
  private readonly teamJoinStore = inject(TeamJoinStore);

  readonly token = input<string>();

  constructor() {
    this.teamJoinStore.join(this.token);
  }
}
