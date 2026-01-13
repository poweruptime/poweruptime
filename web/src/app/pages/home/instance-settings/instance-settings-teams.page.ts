import {ChangeDetectionStrategy, Component} from '@angular/core';

import {TeamList} from '@app/components/team';

@Component({
  template: `
    <pu-team-list />
  `,
  selector: 'pu-instance-settings-teams-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TeamList],
})
export class InstanceSettingsTeamsPage {}
