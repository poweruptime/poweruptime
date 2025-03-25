import {ChangeDetectionStrategy, Component, inject} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';

import {BackendType} from '@app/api';
import {TeamUserInviteForm} from '@app/components/team';
import {SelectedTeamStore, TeamUsersStore} from '@app/services';

@Component({
  template: `
    <div class="flex flex-col gap-4">
      <h1 class="text-4xl">{{ 'team.invite' | transloco }}</h1>

      <pu-team-user-invite-form class="max-w-md" (submitCreate)="invite($event)" />
    </div>
  `,
  selector: 'pu-team-invite-page',
  imports: [TeamUserInviteForm, TranslocoPipe],
  providers: [TeamUsersStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamInvitePage {
  selectedTeamId = inject(SelectedTeamStore).selectedTeamId;
  teamUsersStore = inject(TeamUsersStore);

  invite(dto: BackendType['InviteTeamUserDto']): void {
    void this.teamUsersStore.invite({
      teamId: this.selectedTeamId()!,
      ...dto,
    });
  }
}
