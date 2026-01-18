import {ChangeDetectionStrategy, Component, inject, input} from '@angular/core';
import {RouterLink} from '@angular/router';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmDialogService} from '@spartan-ng/helm/dialog';
import {HlmEmptyImports} from '@spartan-ng/helm/empty';
import {HlmIconImports} from '@spartan-ng/helm/icon';

import {TeamInviteDialog} from '../../_dialog/team-invite-dialog';

@Component({
  template: `
    <div hlmEmpty>
      <div hlmEmptyHeader>
        <div hlmEmptyMedia variant="icon">
          <ng-icon name="lucideMailCheck" />
        </div>
        <div hlmEmptyTitle>{{ 'team.settings.noInvites' | transloco }}</div>
        <div hlmEmptyDescription>
          No pending invitations. Already invited someone? Check the members list above. Otherwise,
          invite a new member.
        </div>
      </div>
      <div class="flex gap-2" hlmEmptyContent>
        <a routerLink="../invite" hlmBtn type="button">
          <ng-icon hlm size="sm" name="lucideUserPlus" />
          {{ 'team.invite' | transloco }}
        </a>
      </div>
    </div>
  `,
  selector: 'pu-team-invites-empty',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe, HlmEmptyImports, HlmIconImports, HlmButtonImports, RouterLink],
})
export class TeamInvitesEmpty {
  private readonly dialog = inject(HlmDialogService);

  readonly teamId = input.required<string>();

  openInviteDialog() {
    this.dialog.open(TeamInviteDialog, {
      context: {
        teamId: this.teamId(),
      },
    });
  }
}
