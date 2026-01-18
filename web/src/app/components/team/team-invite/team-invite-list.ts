import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmCardImports} from '@spartan-ng/helm/card';

import {TeamInvitesStore} from '@app/services';

import {TeamInviteTable} from './team-invite-table';
import {TeamInvitesEmpty} from './team-invites-empty.component';

@Component({
  template: `
    <section class="flex flex-col gap-6" hlmCard>
      @if (teamInvitesStore.isEmpty()) {
        <div hlmCardContent>
          <pu-team-invites-empty [teamId]="teamId()" />
        </div>
      } @else {
        <div hlmCardHeader>
          <h3 hlmCardTitle>{{ 'team.edit.openInvites' | transloco }}</h3>
        </div>
        <div hlmCardContent>
          <pu-team-invite-table />
        </div>
      }
    </section>
  `,
  selector: 'pu-team-invite-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe, HlmCardImports, TeamInviteTable, TeamInvitesEmpty],
})
export class TeamInviteList {
  protected readonly teamInvitesStore = inject(TeamInvitesStore);

  readonly teamId = input.required<string>();

  constructor() {
    this.teamInvitesStore.load(
      computed(() => ({
        teamId: this.teamId(),
        ...this.teamInvitesStore.pageable(),
      })),
    );
  }
}
