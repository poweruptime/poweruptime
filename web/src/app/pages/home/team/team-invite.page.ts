import {ChangeDetectionStrategy, Component, inject} from '@angular/core';

import {BackendType} from '@app/api';
import {TeamUserInviteForm} from '@app/components/team';
import {SelectedTeamStore, TeamUsersStore} from '@app/services';

@Component({
  template: `
    <div class="flex flex-col gap-4">
      <h1 class="text-4xl">Invite a new member</h1>

      <pu-team-user-invite-form class="max-w-md" (submitCreate)="invite($event)" />
    </div>
  `,
  selector: 'pu-team-invite-page',
  imports: [TeamUserInviteForm],
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
