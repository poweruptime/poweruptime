import {ChangeDetectionStrategy, Component} from '@angular/core';
import {RouterLink} from '@angular/router';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmEmptyImports} from '@spartan-ng/helm/empty';
import {HlmIconImports} from '@spartan-ng/helm/icon';

@Component({
  template: `
    <div hlmEmpty>
      <div hlmEmptyHeader>
        <div hlmEmptyMedia variant="icon">
          <ng-icon name="bootstrapEnvelopeSlash" />
        </div>
        <div hlmEmptyTitle>{{ 'team.settings.noInvites' | transloco }}</div>
        <div hlmEmptyDescription>
          No pending invitations. Already invited someone? Check the members list above. Otherwise,
          invite a new member.
        </div>
      </div>
      <div class="flex gap-2" hlmEmptyContent>
        <a routerLink="../invite">
          <button hlmBtn type="button">{{ 'team.invite' | transloco }}</button>
        </a>
      </div>
    </div>
  `,
  selector: 'pu-team-invites-empty',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe, HlmEmptyImports, HlmIconImports, HlmButtonImports, RouterLink],
})
export class TeamInvitesEmpty {}
